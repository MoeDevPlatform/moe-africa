#!/usr/bin/env python3
"""
In-place humanize of Playwright seed artisans/products on the live backend.

- Targets existing PW-SEED records (does NOT create new accounts)
- Updates names, descriptions, and images via authenticated artisan APIs
- Fetches images from Pexels server-side (PEXELS_API_KEY from local .env)
- Enforces final image size < 2 MB
- Never prints secrets

Usage:
  python3 scripts/humanize_seed_marketplace.py
  python3 scripts/humanize_seed_marketplace.py --run-id r20261009135030
"""

from __future__ import annotations

import argparse
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
API = os.environ.get("MOE_API_BASE_URL", "https://moe-backend.duckdns.org").rstrip("/")
SEED_PASSWORD = "SeedTest123!"
MAX_BYTES = 2 * 1024 * 1024 - 1  # strictly under 2 MB
MANIFEST_PATH = ROOT / "test-results" / "humanize-manifest.json"
USED_PHOTO_IDS: set[int] = set()


def load_dotenv(path: Path = ROOT / ".env") -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    for k, v in env.items():
        os.environ.setdefault(k, v)
    return env


DEFAULT_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def http_json(
    method: str,
    url: str,
    *,
    token: str | None = None,
    data: dict | None = None,
    headers: dict | None = None,
) -> Any:
    body = None if data is None else json.dumps(data).encode("utf-8")
    hdrs = {
        "Accept": "application/json",
        "User-Agent": DEFAULT_UA,
        **(headers or {}),
    }
    if body is not None:
        hdrs["Content-Type"] = "application/json"
    if token:
        hdrs["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            raw = res.read()
            return json.loads(raw.decode()) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:400]
        raise RuntimeError(f"{method} {url} -> {e.code}: {detail}") from e


def http_bytes(url: str, headers: dict | None = None) -> bytes:
    hdrs = {"User-Agent": DEFAULT_UA, **(headers or {})}
    req = urllib.request.Request(url, headers=hdrs)
    with urllib.request.urlopen(req, timeout=120) as res:
        return res.read()

def get_all(path: str) -> list[dict]:
    items: list[dict] = []
    page = 1
    while True:
        body = http_json("GET", f"{API}{path}?page={page}&pageSize=100")
        chunk = body.get("data") or []
        items.extend(chunk)
        total_pages = (body.get("pagination") or {}).get("totalPages") or 1
        if not chunk or page >= total_pages:
            break
        page += 1
    return items


def strip_seed_tag(name: str) -> str:
    return re.sub(r"^\[PW-SEED [^\]]+\]\s*", "", name or "").strip()


def run_id_from_name(name: str) -> str | None:
    m = re.search(r"\[PW-SEED ([^\]]+)\]", name or "")
    return m.group(1) if m else None


# Realistic remaps keyed by original (untagged) business / product names from the seed fixture.
ARTISAN_REMAP: dict[str, dict[str, Any]] = {
    "Adaobi Atelier Lagos": {
        "businessName": "Lekki Thread Atelier",
        "description": (
            "A Lekki-based couture studio specialising in Ankara eveningwear, "
            "aso-ebi coordination, and tailored lace for weddings and corporate events."
        ),
        "about": (
            "Founded by a small team of pattern-makers and finishers, Lekki Thread Atelier "
            "builds each piece to measurement. Clients often come for ceremony looks that "
            "balance bold print with clean modern lines."
        ),
        "store_query": "african fabric sewing atelier workshop",
        "cover_query": "colorful ankara fabric rolls textile",
    },
    "Okeke Menswear Studio": {
        "businessName": "Allen Avenue Menswear",
        "description": (
            "Contemporary Nigerian menswear — oxford shirts, slim trousers, and "
            "ceremony-ready dashiki pieces cut for everyday comfort."
        ),
        "about": (
            "Working from Ikeja, the studio focuses on breathable fabrics and precise "
            "fittings for humid weather. Appointments cover both ready silhouettes and "
            "light custom adjustments."
        ),
        "store_query": "mens tailor workshop sewing machine",
        "cover_query": "folded dress shirts clothing display",
    },
    "Ngozi Threadworks": {
        "businessName": "Ogui Readywear",
        "description": (
            "Women’s ready-to-wear from Enugu — midi skirts, peplum tops, and "
            "Afrocentric two-piece sets for office and weekends."
        ),
        "about": (
            "Ogui Readywear keeps silhouettes simple so print and fabric can lead. "
            "Small-batch drops mean limited colourways and careful finishing on every hem."
        ),
        "store_query": "african dress fashion boutique",
        "cover_query": "woman sewing colorful fabric",
    },
    "Bello Craft Collective": {
        "businessName": "Kano Weave Collective",
        "description": (
            "Handwoven baskets, indigo scarves, and beaded table pieces rooted in "
            "Northern Nigerian craft traditions."
        ),
        "about": (
            "A cooperative of weavers and dyers in Kano. Pieces are made in small runs "
            "using palm leaf, cotton, and glass beads — meant for daily use as much as display."
        ),
        "store_query": "handmade woven basket africa craft",
        "cover_query": "indigo dyed fabric textile market",
    },
    "Okafor Studio Crafts": {
        "businessName": "Awka Clay & Form",
        "description": (
            "Wheel-thrown ceramics, terracotta planters, and mixed-media pieces for "
            "homes and small galleries in the South-East."
        ),
        "about": (
            "The studio works primarily in stoneware and terracotta. Glazes stay matte "
            "and earthy so the clay body remains the focus."
        ),
        "store_query": "pottery studio ceramic workshop",
        "cover_query": "handmade ceramic pottery on shelf",
    },
    "Amina Paper & Print": {
        "businessName": "Wuse Paper Studio",
        "description": (
            "Artisanal stationery, map prints, and invitation suites with West African motifs."
        ),
        "about": (
            "Based in Abuja, Wuse Paper Studio pairs letterpress-inspired layouts with "
            "Adire and Ankara-covered notebooks for gifts and events."
        ),
        "store_query": "handmade stationery paper craft desk",
        "cover_query": "art print posters on wall",
    },
    "SoleCraft Aba": {
        "businessName": "Azikiwe Sole Works",
        "description": (
            "Hand-stitched oxfords, Chelsea boots, and leather slides made in Aba."
        ),
        "about": (
            "Aba’s footwear tradition shows up in durable soles and careful lasting. "
            "Most pairs are built to order with a short fitting window."
        ),
        "store_query": "handmade leather shoes cobbler workshop",
        "cover_query": "brown leather oxford shoes",
    },
    "Chioma Heel House": {
        "businessName": "Surulere Heel Atelier",
        "description": (
            "Women’s block heels, bridal satins, and Ankara mules custom-fitted in Lagos."
        ),
        "about": (
            "Comfort-first lasts and measured heel heights. Bridal orders include a "
            "fabric-matching session so shoes sit cleanly with the outfit."
        ),
        "store_query": "women high heel shoes boutique",
        "cover_query": "elegant bridal shoes satin",
    },
    "Bakare Boots Co.": {
        "businessName": "Ring Road Boot Co.",
        "description": (
            "Rugged desert boots, chukkas, and work footwear built for long wear in Ibadan."
        ),
        "about": (
            "Heavy on suede and full-grain leather, with crepe or rubber soles chosen "
            "for the intended use rather than trend."
        ),
        "store_query": "suede desert boots shoes",
        "cover_query": "leather boot making workshop",
    },
    "Beauty by Bisi": {
        "businessName": "Yaba Glow Lab",
        "description": (
            "Shea hair butters, black soap bars, and bridal prep kits mixed in small batches."
        ),
        "about": (
            "Formulas lean on familiar West African ingredients — shea, plant oils, "
            "and traditional black soap — without overclaiming results."
        ),
        "store_query": "natural skincare products shea butter",
        "cover_query": "beauty products bottles on table",
    },
    "Zainab Naturals": {
        "businessName": "Garki Botanicals",
        "description": (
            "Plant-based face mists, body butters, and clay masks formulated in Abuja."
        ),
        "about": (
            "Short ingredient lists and refill-friendly jars. Popular with clients who "
            "want everyday skincare without heavy fragrance."
        ),
        "store_query": "natural organic skincare jars",
        "cover_query": "hibiscus flowers botanical flatlay",
    },
    "Adeyemi Leather Lab": {
        "businessName": "Mushin Leather Lab",
        "description": (
            "Messenger bags, bifolds, and weekenders cut from Nigerian full-grain leather."
        ),
        "about": (
            "A compact workshop focused on clean hardware and reinforced stitching. "
            "Most bags are lined and sized for daily commute use."
        ),
        "store_query": "handmade leather bag workshop",
        "cover_query": "leather messenger bag product",
    },
    "Sade Leather Atelier": {
        "businessName": "Abeokuta Soft Goods",
        "description": (
            "Minimal leather crossbodies, clutches, and sleeves with optional monogramming."
        ),
        "about": (
            "Soft leathers and quiet hardware. Pieces are designed to age rather than "
            "look pristine forever."
        ),
        "store_query": "leather crossbody bag handmade",
        "cover_query": "leather craft tools workshop",
    },
    "Uche Strapworks": {
        "businessName": "Port Harcourt Strap Co.",
        "description": (
            "Camera straps, watch straps, and specialty leather accessories from Rivers State."
        ),
        "about": (
            "Narrow goods done carefully — consistent stitching, reliable hardware, "
            "and lengths that actually fit common cameras and watches."
        ),
        "store_query": "leather camera strap handmade",
        "cover_query": "leather watch strap close up",
    },
    "Okoro Beads & Gold": {
        "businessName": "Owerri Coral House",
        "description": (
            "Coral bead necklaces, bridal sets, and waist beads for ceremonies and everyday wear."
        ),
        "about": (
            "Traditional colour stories meet lighter modern proportions so pieces sit "
            "comfortably through long events."
        ),
        "store_query": "african coral beads necklace jewellery",
        "cover_query": "handmade beaded jewellery display",
    },
    "Yetunde Fine Jewels": {
        "businessName": "VI Fine Lines",
        "description": (
            "Everyday gold vermeil and sterling pieces — layered chains, pearl studs, stackable rings."
        ),
        "about": (
            "A Victoria Island counter for clients who want jewellery that layers quietly "
            "with workwear and evening looks."
        ),
        "store_query": "gold necklace jewellery minimal",
        "cover_query": "pearl earrings jewellery product",
    },
    "Afolabi Home Studio": {
        "businessName": "Bodija Wood & Home",
        "description": (
            "Iroko side tables, carved stools, and soft home accents crafted in Ibadan."
        ),
        "about": (
            "Furniture pieces favour solid wood and simple joinery. Soft goods use Ankara "
            "and local textiles for colour."
        ),
        "store_query": "wooden furniture craft workshop africa",
        "cover_query": "wooden side table interior",
    },
    "Sule Living": {
        "businessName": "Kaduna Loom & Living",
        "description": (
            "Handwoven rugs, embroidered runners, and ceramic accents with Northern motifs."
        ),
        "about": (
            "Textiles lead the collection — rugs and runners woven in small lots, "
            "paired with simple ceramic vessels."
        ),
        "store_query": "handwoven rug textile home decor",
        "cover_query": "ceramic vase home interior",
    },
    "Canvas & Co. Studio": {
        "businessName": "Ikoyi Canvas Room",
        "description": (
            "Original acrylic and oil works on canvas — cityscapes, market scenes, and abstracts."
        ),
        "about": (
            "A small Ikoyi studio producing ready paintings and commissioned portraits. "
            "Work is finished on stretched canvas ready to hang."
        ),
        "store_query": "artist painting studio canvas easel",
        "cover_query": "abstract acrylic painting on canvas",
    },
    "Balogun Print House": {
        "businessName": "Maryland Print Atelier",
        "description": (
            "Gallery-wrap photo canvases, pop-art transfers, and panoramic skyline prints."
        ),
        "about": (
            "Print-focused rather than freehand painting. Clients bring photos or choose "
            "from skyline and nursery collections."
        ),
        "store_query": "canvas print photo wall art",
        "cover_query": "framed canvas prints on wall",
    },
}

PRODUCT_REMAP: dict[str, dict[str, str]] = {
    # Tailoring — Lekki Thread Atelier
    "Ankara Evening Wrap Dress": {
        "name": "Indigo Ankara Wrap Dress",
        "description": "Wrap silhouette in dense Ankara cotton with a side slit and covered button closure. Lined bodice; falls mid-calf.",
        "query": "african print wrap dress ankara",
    },
    "Senator Kaftan Set": {
        "name": "Embroidered Senator Kaftan",
        "description": "Two-piece senator set in a soft cashmere-feel weave with restrained chest embroidery. Includes drawstring trouser.",
        "query": "african senator kaftan menswear",
    },
    "Bridal Lace Blouse": {
        "name": "Beaded French Lace Bridal Top",
        "description": "Bridal blouse in French lace with a hand-beaded neckline. Designed to pair with gele or a simple skirt.",
        "query": "lace bridal blouse wedding",
    },
    "Agbada Ceremonial Set": {
        "name": "Brocade Three-Piece Agbada",
        "description": "Full agbada set in guinea brocade with tonal embroidery on the outer robe. Includes danshiki and trouser.",
        "query": "agbada traditional african attire",
    },
    "Office Pencil Skirt Suit": {
        "name": "Charcoal Pencil Skirt Suit",
        "description": "Tailored jacket and pencil skirt in charcoal wool blend. Soft shoulder, lined skirt with back vent.",
        "query": "women charcoal skirt suit office",
    },
    # Menswear
    "Oxford Collar Shirt": {
        "name": "White Oxford Button-Down",
        "description": "Classic oxford cloth shirt with a structured collar and mother-of-pearl buttons. Regular fit through the torso.",
        "query": "white oxford dress shirt men",
    },
    "Ankara Pocket Square Set": {
        "name": "Ankara Pocket Square Trio",
        "description": "Set of three rolled pocket squares in coordinated Ankara prints. Finished edges, gift-ready fold.",
        "query": "colorful pocket square fabric",
    },
    "Slim Fit Trouser": {
        "name": "Navy Slim Tailored Trouser",
        "description": "Slim trousers in stretch cotton with reinforced seams and a clean front crease. Mid-rise waist.",
        "query": "mens slim fit trousers navy",
    },
    "Wedding Guest Dashiki": {
        "name": "Contemporary Wedding Dashiki",
        "description": "Modern dashiki cut for wedding guests — lighter weight fabric with subtle embroidery at the placket.",
        "query": "dashiki african shirt colorful",
    },
    "Linen Summer Shirt": {
        "name": "Sand Linen Camp Shirt",
        "description": "Breathable 100% linen shirt with a camp collar. Washed for softness; best worn slightly relaxed.",
        "query": "linen shirt men summer beige",
    },
    # Women's RTW
    "Midi Ankara Skirt": {
        "name": "A-Line Ankara Midi Skirt",
        "description": "A-line midi with side pockets and a concealed zip. Structured waistband, soft cotton handfeel.",
        "query": "african print midi skirt",
    },
    "Peplum Blouse": {
        "name": "Structured Crepe Peplum Top",
        "description": "Office-ready peplum blouse in crepe with short sleeves and a clean neckline. Slight stretch.",
        "query": "women peplum blouse office",
    },
    "Two-Piece Palazzo Set": {
        "name": "Ankara Crop & Palazzo Set",
        "description": "Matching crop top and wide palazzo pants in coordinated Ankara. Elastic waist on the trouser.",
        "query": "african print two piece outfit",
    },
    "Cocktail Sheath Dress": {
        "name": "Gold-Trim Cocktail Sheath",
        "description": "Knee-length sheath in stretch crepe with a fine gold trim at the neckline. Lined for opacity.",
        "query": "black cocktail sheath dress",
    },
    "Kids Ankara Pinafore": {
        "name": "Children’s Ankara Pinafore",
        "description": "Soft Ankara pinafore for kids with adjustable straps and a roomy skirt. Easy machine wash.",
        "query": "kids african print dress",
    },
    # Arts & crafts
    "Handwoven Market Basket": {
        "name": "Palm-Leaf Market Basket",
        "description": "Handwoven palm-leaf basket with dyed accents. Sturdy enough for market runs; doubles as floor décor.",
        "query": "handmade woven basket market",
    },
    "Beaded Table Runner": {
        "name": "Geometric Beaded Table Runner",
        "description": "Cotton runner finished with geometric glass-bead motifs along the border. Approx. dining-table length.",
        "query": "beaded table runner handmade",
    },
    "Carved Wooden Mask Mini": {
        "name": "Mini Carved Wall Mask",
        "description": "Small decorative mask carved from iroko for wall display. Natural oil finish; hang hardware included.",
        "query": "african wooden mask carving",
    },
    "Indigo Dye Scarf": {
        "name": "Resist-Dyed Indigo Scarf",
        "description": "Hand-dyed indigo cotton scarf with classic resist patterning. Lightweight for year-round wear.",
        "query": "indigo dyed scarf textile",
    },
    "Greeting Card Set (12)": {
        "name": "Afrocentric Greeting Card Pack",
        "description": "Twelve illustrated cards with blank interiors. Printed on heavy cardstock with kraft envelopes.",
        "query": "handmade greeting cards set",
    },
    "Ceramic Water Jug": {
        "name": "Matte Stoneware Water Jug",
        "description": "Wheel-thrown stoneware jug with a matte glaze and comfortable pour spout. Holds roughly 1.2 litres.",
        "query": "ceramic water jug pottery",
    },
    "Terracotta Planter Set": {
        "name": "Nested Terracotta Planter Trio",
        "description": "Three nested terracotta planters with drainage holes. Unglazed exterior; suitable for indoor plants.",
        "query": "terracotta planter pots set",
    },
    "Wire Sculpture Bird": {
        "name": "Brass Wire Bird Sculpture",
        "description": "Abstract bird form in bent brass wire on a small wooden base. Desk or shelf scale.",
        "query": "brass wire sculpture bird",
    },
    "Batik Wall Hanging": {
        "name": "Large Batik Wall Panel",
        "description": "Cotton batik panel ready to hang from a wooden dowel. Bold resist pattern in indigo and rust.",
        "query": "batik fabric wall hanging",
    },
    "Clay Incense Holder": {
        "name": "Pressed Clay Incense Dish",
        "description": "Hand-pressed clay dish with a glazed centre well for stick incense. Compact footprint.",
        "query": "clay incense holder ceramic",
    },
    "Adire Notebook Trio": {
        "name": "Adire-Cover Notebook Trio",
        "description": "Three A5 notebooks bound with Adire fabric covers. Lined pages; elastic closure on each.",
        "query": "fabric cover notebook journal",
    },
    "Lagos Map Art Print": {
        "name": "Stylised Lagos Map Print",
        "description": "Limited art print of a stylised Lagos map on archival paper. Unframed; ships flat.",
        "query": "city map art print poster",
    },
    "Calligraphy Quote Card": {
        "name": "Hand-Lettered Affirmation Cards",
        "description": "Set of hand-lettered affirmation cards on thick stock. Suitable for gifting or framing.",
        "query": "calligraphy quote card handmade",
    },
    "Origami Decor Pack": {
        "name": "Ankara Paper Origami Pack",
        "description": "Pre-folded origami décor pieces in Ankara-patterned papers. Includes display tips.",
        "query": "colorful origami paper decorations",
    },
    "Wedding Invitation Suite": {
        "name": "Sample Wedding Invitation Suite",
        "description": "Sample pack showing invitation, RSVP, and details card layouts on premium cardstock.",
        "query": "wedding invitation suite stationery",
    },
    # Shoes
    "Classic Oxford Brown": {
        "name": "Goodyear-Welt Brown Oxford",
        "description": "Full-grain brown oxford with Goodyear welting and a leather sole. Built for resoling over time.",
        "query": "brown leather oxford shoes men",
    },
    "Chelsea Boot Black": {
        "name": "Black Leather Chelsea Boot",
        "description": "Black Chelsea with elastic gussets and a stacked heel. Leather upper, rubber outsole.",
        "query": "black chelsea boots leather",
    },
    "Leather Slide Sandal": {
        "name": "Vegetable-Tan Leather Slides",
        "description": "Open slide sandal in vegetable-tanned leather. Contoured footbed; softens with wear.",
        "query": "leather slide sandals handmade",
    },
    "Monk Strap Loafer": {
        "name": "Single-Buckle Monk Loafer",
        "description": "Calf-leather monk strap with a single buckle and leather lining. Formal enough for events.",
        "query": "monk strap loafers leather",
    },
    "Kids School Shoe": {
        "name": "Cushioned Kids School Shoe",
        "description": "Durable school shoe with a cushioned insole and scuff-resistant toe. Lace-up closure.",
        "query": "kids leather school shoes",
    },
    "Block Heel Pump": {
        "name": "Nude Block-Heel Pump",
        "description": "Nude leather pump on a stable block heel. Padded insole for longer wear at events.",
        "query": "nude block heel pumps women",
    },
    "Bridal Satin Heel": {
        "name": "Ivory Satin Bridal Heel",
        "description": "Ivory satin heel with a small pearl clasp detail. Heel height suited to all-day ceremonies.",
        "query": "ivory satin bridal heels",
    },
    "Ankara Flat Mule": {
        "name": "Ankara-Wrapped Flat Mule",
        "description": "Backless mule wrapped in Ankara over a leather sole. Easy slip-on for warm weather.",
        "query": "fabric mule flat shoes women",
    },
    "Strappy Evening Sandal": {
        "name": "Gold Strappy Evening Sandal",
        "description": "Gold-tone strappy sandal with a slim heel and ankle buckle. Leather footbed.",
        "query": "gold strappy evening sandals",
    },
    "Wedge Espadrille": {
        "name": "Jute Wedge Espadrille",
        "description": "Canvas upper on a jute wedge sole. Weekend-ready height without a sharp heel.",
        "query": "wedge espadrille shoes women",
    },
    "Desert Boot Tan": {
        "name": "Tan Suede Desert Boot",
        "description": "Classic desert boot in tan suede with a crepe sole. Two-eyelet lace, unlined upper.",
        "query": "tan suede desert boots",
    },
    "Work Boot Steel Cap": {
        "name": "Steel-Toe Work Boot",
        "description": "Leather work boot with steel toe protection and a grippy rubber sole. Lace-up shaft.",
        "query": "steel toe work boots leather",
    },
    "Chukka Boot Navy": {
        "name": "Navy Leather Chukka",
        "description": "Navy chukka with a rubber sole and soft leather lining. Casual height, clean toe.",
        "query": "navy chukka boots leather",
    },
    "Moccasin Soft Sole": {
        "name": "Soft-Sole Driving Moccasin",
        "description": "Nappa leather driving moccasin with a flexible sole. Hand-sewn apron toe.",
        "query": "leather driving moccasins men",
    },
    "Rain Boot Gloss": {
        "name": "Gloss Waterproof Rain Boot",
        "description": "Waterproof gloss rain boot with textile lining. Mid-calf height for wet-season errands.",
        "query": "glossy rain boots waterproof",
    },
    # Beauty
    "Shea Hair Butter 250ml": {
        "name": "Whipped Shea Hair Butter",
        "description": "250 ml whipped shea butter blended with light oils for twist-outs and wash-and-gos. Jar format.",
        "query": "shea butter hair cream jar",
    },
    "Bridal Glow Kit": {
        "name": "Bridal Prep Glow Kit",
        "description": "Compact kit with primer, highlighter, and setting spray sized for bridal prep days.",
        "query": "bridal makeup kit cosmetics",
    },
    "Black Soap Face Bar": {
        "name": "African Black Soap Bar",
        "description": "Traditional plant-ash black soap bar for face and body. Unscented; wrap individually.",
        "query": "african black soap bar",
    },
    "Argan Scalp Oil": {
        "name": "Lightweight Argan Scalp Oil",
        "description": "Dropper bottle of argan oil intended for scalp massage and ends. Light enough for fine hair.",
        "query": "argan oil bottle haircare",
    },
    "Makeup Brush Set (8)": {
        "name": "Eight-Piece Vegan Brush Set",
        "description": "Synthetic-bristle brush set with a zip pouch. Includes face and eye shapes for everyday makeup.",
        "query": "makeup brush set pouch",
    },
    "Hibiscus Face Mist": {
        "name": "Hibiscus Toner Face Mist",
        "description": "Refreshing hibiscus extract mist for use after cleansing. Fine spray; travel-friendly bottle.",
        "query": "facial mist spray bottle skincare",
    },
    "Cocoa Body Butter": {
        "name": "Rich Cocoa Body Butter",
        "description": "Thick cocoa butter cream for dry skin. Soft cocoa scent; best applied on damp skin.",
        "query": "cocoa body butter jar",
    },
    "Clay Detox Mask": {
        "name": "Kaolin Tea-Tree Clay Mask",
        "description": "Kaolin clay mask with a touch of tea tree. Tub format; rinse after 10–15 minutes.",
        "query": "clay face mask jar skincare",
    },
    "Lip Balm Trio": {
        "name": "Tinted Shea Lip Balm Trio",
        "description": "Three shea-based lip balms in soft tints. Beeswax base; pocket-size tubes.",
        "query": "lip balm trio set natural",
    },
    "Aromatherapy Roller": {
        "name": "Lavender-Citrus Oil Roller",
        "description": "Essential-oil roller blending lavender and citrus notes. Glass bottle with metal rollerball.",
        "query": "essential oil roller bottle",
    },
    # Leather
    "Messenger Laptop Bag": {
        "name": "Padded Leather Laptop Messenger",
        "description": "Full-grain messenger with a padded 15\" sleeve and buckle flap. Interior zip pocket.",
        "query": "leather messenger laptop bag",
    },
    "Bifold Wallet": {
        "name": "Slim RFID Bifold Wallet",
        "description": "Vegetable-tanned bifold with RFID lining and six card slots. Slim profile for front pockets.",
        "query": "slim leather bifold wallet",
    },
    "Tooled Belt 36mm": {
        "name": "Hand-Tooled Brass-Buckle Belt",
        "description": "36 mm leather belt with hand tooling and a solid brass buckle. Cut to length on request.",
        "query": "tooled leather belt brass buckle",
    },
    "Weekender Duffel": {
        "name": "Full-Grain Leather Weekender",
        "description": "Spacious leather duffel with dual handles and a shoulder strap. Fits a short trip’s clothes.",
        "query": "leather weekender duffel bag",
    },
    "Card Holder Mini": {
        "name": "Four-Slot Leather Card Holder",
        "description": "Minimal four-slot card holder in smooth leather. Stitches finished clean on the edges.",
        "query": "leather card holder minimal",
    },
    "Crossbody Mini Bag": {
        "name": "Soft Leather Mini Crossbody",
        "description": "Compact crossbody in soft leather with an adjustable strap and magnetic closure.",
        "query": "mini leather crossbody bag women",
    },
    "Passport Cover": {
        "name": "Embossed Leather Passport Cover",
        "description": "Passport cover with light embossing and a card slot on the inner flap.",
        "query": "leather passport holder cover",
    },
    'Laptop Sleeve 13"': {
        "name": "13-Inch Leather Laptop Sleeve",
        "description": "Slim padded sleeve for 13\" laptops. Leather exterior with felt lining.",
        "query": "leather laptop sleeve case",
    },
    "Key Organiser": {
        "name": "Leather Hook Key Organiser",
        "description": "Fold-over key organiser with a metal hook ring. Keeps keys from wearing pockets.",
        "query": "leather key organizer holder",
    },
    "Tassel Clutch": {
        "name": "Suede Tassel Evening Clutch",
        "description": "Suede evening clutch with a detachable tassel and optional wrist strap.",
        "query": "suede clutch bag tassel",
    },
    "Camera Strap Vintage": {
        "name": "Padded Vintage Camera Strap",
        "description": "Padded leather camera strap with brass hardware and adjustable length.",
        "query": "leather camera strap vintage",
    },
    "Watch Strap 20mm": {
        "name": "20 mm Quick-Release Watch Strap",
        "description": "Leather watch strap with quick-release spring bars. Standard 20 mm lug width.",
        "query": "leather watch strap 20mm",
    },
    "Guitar Strap Soft": {
        "name": "Wide Soft Leather Guitar Strap",
        "description": "Wide leather guitar strap with soft backing for longer practice sessions.",
        "query": "leather guitar strap",
    },
    "Dog Collar & Lead": {
        "name": "Matched Leather Collar & Lead",
        "description": "Collar and lead set in matching leather with sturdy hardware. Sized for medium dogs.",
        "query": "leather dog collar leash set",
    },
    "Journal Cover A5": {
        "name": "Refillable A5 Journal Cover",
        "description": "Leather cover sized for A5 notebooks with a strap closure. Notebooks swap out easily.",
        "query": "leather journal cover notebook",
    },
    # Jewellery
    "Coral Bead Necklace": {
        "name": "Traditional Coral Strand Necklace",
        "description": "Coral bead strand with a gold-plated clasp. Strung for ceremony weight without excess length.",
        "query": "coral bead necklace african",
    },
    "Ankara Hoop Earrings": {
        "name": "Ankara-Wrapped Hoop Earrings",
        "description": "Lightweight metal hoops wrapped in Ankara fabric. Secure latch backs.",
        "query": "fabric hoop earrings colorful",
    },
    "Bridal Jewellery Set": {
        "name": "Crystal Bridal Jewellery Set",
        "description": "Necklace, earrings, bracelet, and tiara set with crystals and pearls for bridal looks.",
        "query": "bridal jewellery set pearls crystals",
    },
    "Waist Beads Custom": {
        "name": "Custom Colour Waist Beads",
        "description": "Glass waist beads on elastic, strung to your colour mix. Lightweight for daily wear.",
        "query": "african waist beads colorful",
    },
    "Gold Plate Cuff": {
        "name": "Brushed Gold Plate Cuff",
        "description": "Wide cuff bracelet with a brushed gold-plate finish. Open back for flexible fit.",
        "query": "gold cuff bracelet wide",
    },
    "Layered Chain Necklace": {
        "name": "Triple-Layer Fine Chain Necklace",
        "description": "Three fine chains in gold vermeil at staggered lengths. Lobster clasp.",
        "query": "layered gold chain necklace",
    },
    "Pearl Stud Earrings": {
        "name": "Freshwater Pearl Studs",
        "description": "Freshwater pearl studs on sterling posts with secure backs. Everyday size.",
        "query": "freshwater pearl stud earrings",
    },
    "Stackable Ring Set": {
        "name": "Five-Stack Sterling Rings",
        "description": "Set of five thin sterling silver rings meant to stack or wear alone.",
        "query": "stackable silver rings set",
    },
    "Anklet Charm": {
        "name": "Disc-Charm Vermeil Anklet",
        "description": "Delicate gold-vermeil anklet with a small disc charm. Adjustable extender.",
        "query": "gold anklet charm jewellery",
    },
    "Statement Cocktail Ring": {
        "name": "CZ Statement Cocktail Ring",
        "description": "Oversized cocktail ring with a central CZ stone in a sculpted setting.",
        "query": "statement cocktail ring crystal",
    },
    # Home
    "Iroko Side Table": {
        "name": "Iroko Hairpin Side Table",
        "description": "Solid iroko top on steel hairpin legs. Compact scale for sofas and reading chairs.",
        "query": "wooden side table hairpin legs",
    },
    "Ankara Throw Pillow": {
        "name": "Ankara Print Throw Pillow",
        "description": "Cushion cover in Ankara print with a hidden zip. Insert included; approx. 45 cm.",
        "query": "african print throw pillow cushion",
    },
    "Floating Shelf Pair": {
        "name": "Walnut-Finish Floating Shelves",
        "description": "Pair of floating shelves in a walnut finish with hidden brackets. Easy wall mount.",
        "query": "floating wood shelves wall",
    },
    "Carved Stool Accent": {
        "name": "Hand-Carved Accent Stool",
        "description": "Decorative mahogany stool with carved sides. Suitable as a plant stand or side seat.",
        "query": "carved wooden stool africa",
    },
    "Soy Candle Trio": {
        "name": "Ceramic Jar Soy Candle Trio",
        "description": "Three scented soy candles in ceramic jars. Cotton wicks; gift-boxed as a set.",
        "query": "soy candles ceramic jars set",
    },
    "Woven Floor Rug 4x6": {
        "name": "Geometric Handwoven 4×6 Rug",
        "description": "Handwoven rug with a geometric field, approx. 4×6 ft. Wool-blend pile; cotton warp.",
        "query": "handwoven geometric area rug",
    },
    "Table Runner Embroidered": {
        "name": "Embroidered Linen Table Runner",
        "description": "Linen runner with embroidered border motifs. Soft wash; suits six-seat tables.",
        "query": "embroidered linen table runner",
    },
    "Ceramic Vase Pair": {
        "name": "Tall & Short Ceramic Vase Pair",
        "description": "Matched ceramic vases in two heights with a speckled glaze. Watertight for cut flowers.",
        "query": "ceramic vase pair modern",
    },
    "Macramé Wall Hang": {
        "name": "Large Cotton Macramé Hanging",
        "description": "Large macramé wall hanging in natural cotton cord on a wooden dowel.",
        "query": "macrame wall hanging large",
    },
    "Tea Light Holder Set": {
        "name": "Brass Tea-Light Holder Set",
        "description": "Set of four brass tea-light holders with a brushed finish. Compact round form.",
        "query": "brass tea light holders set",
    },
    # Paintings / prints
    "Lagos Skyline at Dusk": {
        "name": "Lagos Dusk Skyline Canvas",
        "description": "Acrylic skyline on gallery-wrapped canvas. Warm dusk palette; ready to hang.",
        "query": "city skyline painting canvas dusk",
    },
    "Market Day Portrait": {
        "name": "Market Scene Oil on Canvas",
        "description": "Oil painting of a busy market scene with figures and produce stalls. Framed optional.",
        "query": "african market painting art",
    },
    "Abstract Unity Panel": {
        "name": "Geometric Unity Abstract",
        "description": "Mixed-media geometric abstract in earth and indigo tones. Gallery wrap edges painted.",
        "query": "geometric abstract painting canvas",
    },
    "Custom Family Portrait": {
        "name": "Commissioned Family Portrait",
        "description": "Portrait painted from your reference photo on stretched canvas. Timeline agreed per order.",
        "query": "family portrait painting canvas",
    },
    "Mini Canvas Set (3)": {
        "name": "Trio of Mini Canvas Studies",
        "description": "Set of three 8×8 inch acrylic studies. Coordinated palette for shelf displays.",
        "query": "small canvas paintings set",
    },
    "Photo Canvas 16x20": {
        "name": "16×20 Photo Canvas Print",
        "description": "Your photo printed on museum-wrap canvas, 16×20 inches. Colour-checked before print.",
        "query": "photo printed on canvas wrap",
    },
    "Pop Art Portrait Print": {
        "name": "Pop-Art Style Portrait Print",
        "description": "High-contrast pop-art treatment of a portrait photo, printed on canvas.",
        "query": "pop art portrait colorful print",
    },
    "Panoramic Skyline Print": {
        "name": "Panoramic City Skyline Print",
        "description": "Wide panoramic skyline print on canvas. Suited to long sofa walls.",
        "query": "panoramic city skyline canvas",
    },
    "Nursery Animal Trio": {
        "name": "Soft Animal Nursery Print Trio",
        "description": "Three soft animal illustrations sized for nursery walls. Gentle palette; canvas print.",
        "query": "nursery animal wall art prints",
    },
    "Quote Typography Canvas": {
        "name": "Custom Typography Quote Canvas",
        "description": "Typography quote printed on canvas in your chosen words and colourway.",
        "query": "typography quote wall art canvas",
    },
}


def login(email: str, password: str) -> str:
    body = http_json(
        "POST",
        f"{API}/auth/login",
        data={"email": email, "password": password},
    )
    token = body.get("token")
    if not token:
        raise RuntimeError(f"Login failed for {email}")
    return token


def list_my_products(token: str) -> list[dict]:
    items: list[dict] = []
    page = 1
    while True:
        body = http_json(
            "GET",
            f"{API}/artisans/me/products?page={page}&pageSize=50",
            token=token,
        )
        chunk = body.get("data") or []
        items.extend(chunk)
        total_pages = (body.get("pagination") or {}).get("totalPages") or 1
        if not chunk or page >= total_pages:
            break
        page += 1
    return items


def compress_image(raw: bytes, max_bytes: int = MAX_BYTES) -> bytes:
    img = Image.open(io.BytesIO(raw))
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # Start from a sensible product/card size
    max_edge = 1600
    w, h = img.size
    scale = min(1.0, max_edge / max(w, h))
    if scale < 1.0:
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

    quality = 85
    while quality >= 35:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        data = buf.getvalue()
        if len(data) <= max_bytes:
            return data
        # shrink further if still too large
        if quality <= 50:
            w, h = img.size
            img = img.resize((int(w * 0.85), int(h * 0.85)), Image.Resampling.LANCZOS)
        quality -= 5
    raise RuntimeError(f"Unable to compress image under {max_bytes} bytes")


def pexels_search(api_key: str, query: str, per_page: int = 8) -> list[dict]:
    qs = urllib.parse.urlencode({"query": query, "per_page": per_page, "orientation": "landscape"})
    url = f"https://api.pexels.com/v1/search?{qs}"
    body = http_json(
        "GET",
        url,
        headers={
            "Authorization": api_key,
            # Pexels/Cloudflare rejects bare urllib signatures without a browser-like UA
            "User-Agent": DEFAULT_UA,
            "Accept": "application/json",
        },
    )
    return body.get("photos") or []

def fetch_pexels_image(api_key: str, query: str) -> tuple[bytes, dict]:
    photos = pexels_search(api_key, query)
    if not photos:
        # broader fallback
        photos = pexels_search(api_key, query.split()[0] if query else "handmade craft")
    chosen = None
    for photo in photos:
        pid = int(photo.get("id") or 0)
        if pid and pid in USED_PHOTO_IDS:
            continue
        chosen = photo
        break
    if chosen is None and photos:
        chosen = photos[0]
    if chosen is None:
        raise RuntimeError(f"No Pexels results for query={query!r}")

    pid = int(chosen.get("id") or 0)
    if pid:
        USED_PHOTO_IDS.add(pid)

    src = (chosen.get("src") or {})
    download_url = src.get("large2x") or src.get("large") or src.get("original") or src.get("medium")
    if not download_url:
        raise RuntimeError("Pexels photo missing src URL")

    raw = http_bytes(download_url)
    compressed = compress_image(raw)
    if len(compressed) >= 2 * 1024 * 1024:
        raise RuntimeError("Compressed image still >= 2MB")

    photographer = chosen.get("photographer") or "Unknown"
    page_url = chosen.get("url") or ""
    meta = {
        "pexelsId": pid,
        "query": query,
        "photographer": photographer,
        "pageUrl": page_url,
        "downloadUrl": download_url,
        "bytes": len(compressed),
        "attribution": f'Photo by {photographer} on Pexels' + (f" ({page_url})" if page_url else ""),
    }
    return compressed, meta


def upload_image(token: str, endpoint: str, jpeg_bytes: bytes, filename: str) -> str:
    boundary = "----MoeBoundary7MA4YWxkTrZu0gW"
    body = b"".join(
        [
            f"--{boundary}\r\n".encode(),
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode(),
            b"Content-Type: image/jpeg\r\n\r\n",
            jpeg_bytes,
            b"\r\n",
            f"--{boundary}--\r\n".encode(),
        ]
    )
    req = urllib.request.Request(
        f"{API}{endpoint}",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as res:
            payload = json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:400]
        raise RuntimeError(f"Upload {endpoint} -> {e.code}: {detail}") from e

    url = (
        payload.get("url")
        or payload.get("imageUrl")
        or (payload.get("data") or {}).get("url")
        or payload.get("secure_url")
    )
    if not url:
        raise RuntimeError(f"Upload missing url: {payload}")
    return url


def patch_profile(token: str, data: dict) -> dict:
    return http_json("PATCH", f"{API}/artisans/me", token=token, data=data)


def patch_product(token: str, product_id: int, data: dict) -> dict:
    return http_json(
        "PATCH",
        f"{API}/artisans/me/products/{product_id}",
        token=token,
        data=data,
    )


def humanize_artisan(
    *,
    run_id: str,
    index: int,
    api_key: str,
    manifest: dict,
    strip_only: bool = False,
) -> dict:
    email = f"artisan{index:02d}.{run_id}@moe-pw-seed.test"
    token = login(email, SEED_PASSWORD)
    me = http_json("GET", f"{API}/artisans/me", token=token)
    raw_business = me.get("businessName") or me.get("brandName") or ""
    products = list_my_products(token)
    still_tagged = "PW-SEED" in raw_business or any(
        "PW-SEED" in (p.get("name") or "") for p in products
    )
    if not still_tagged:
        print(f"· [{run_id}] {index:02d} already clean — skip", flush=True)
        return {
            "email": email,
            "skipped": True,
            "profileId": me.get("id"),
            "newBusinessName": raw_business,
            "products": [],
        }

    current_name = strip_seed_tag(raw_business)
    remap = None if strip_only else ARTISAN_REMAP.get(current_name)
    if not remap:
        # Strip tag / keep distinct original names (used for leftover runs)
        new_business = current_name or f"Artisan Studio {index}"
        category = (me.get("category") or "craft").replace("_", " ")
        remap = {
            "businessName": new_business,
            "description": me.get("description")
            or f"Independent {category} studio offering handmade pieces on MOE.",
            "about": me.get("about") or me.get("description") or "",
            "store_query": f"handmade {category} artisan workshop",
            "cover_query": f"handmade {category} products display",
        }

    store_bytes, store_meta = fetch_pexels_image(api_key, remap["store_query"])
    time.sleep(0.35)
    cover_bytes, cover_meta = fetch_pexels_image(api_key, remap["cover_query"])
    time.sleep(0.35)

    store_url = upload_image(token, "/artisans/me/upload-image", store_bytes, f"store-{index}.jpg")
    try:
        cover_url = upload_image(
            token, "/artisans/me/upload-cover", cover_bytes, f"cover-{index}.jpg"
        )
    except Exception:
        cover_url = upload_image(
            token, "/artisans/me/upload-image", cover_bytes, f"cover-{index}.jpg"
        )

    profile_payload = {
        "businessName": remap["businessName"],
        "brandName": remap["businessName"],
        "description": remap["description"],
        "about": remap.get("about") or remap["description"],
        "storeImageUrl": store_url,
        "heroImage": store_url,
        "coverImageUrl": cover_url,
    }
    try:
        patch_profile(token, profile_payload)
    except Exception:
        profile_payload.pop("coverImageUrl", None)
        patch_profile(token, profile_payload)

    product_results = []
    for p in products:
        old_name = strip_seed_tag(p.get("name") or "")
        prem = None if strip_only else PRODUCT_REMAP.get(old_name)
        if not prem:
            prem = {
                "name": old_name,
                "description": p.get("description") or old_name,
                "query": f"handmade {old_name}",
            }
        img_bytes, img_meta = fetch_pexels_image(api_key, prem["query"])
        time.sleep(0.35)
        image_url = upload_image(
            token,
            "/artisans/me/products/upload-image",
            img_bytes,
            f"product-{p['id']}.jpg",
        )
        status_before = p.get("status")
        patch_product(
            token,
            int(p["id"]),
            {
                "name": prem["name"],
                "description": prem["description"],
                "images": [image_url],
            },
        )
        product_results.append(
            {
                "id": p["id"],
                "oldName": p.get("name"),
                "newName": prem["name"],
                "statusBefore": status_before,
                "image": img_meta,
            }
        )

    entry = {
        "email": email,
        "profileId": me.get("id"),
        "oldBusinessName": me.get("businessName"),
        "newBusinessName": remap["businessName"],
        "storeImage": store_meta,
        "coverImage": cover_meta,
        "products": product_results,
    }
    manifest["artisans"].append(entry)
    print(
        f"✓ [{run_id}] {index:02d} {current_name!r} → {remap['businessName']!r} "
        f"({len(product_results)} products)",
        flush=True,
    )
    return entry


def main() -> int:
    load_dotenv()
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--run-id",
        default="r20261009135030",
        help="Primary seed run id to humanize (default: main 20×100 batch)",
    )
    parser.add_argument(
        "--also-orphans",
        action="store_true",
        default=False,
        help="Also humanize other PW-SEED run leftovers (off by default)",
    )
    parser.add_argument(
        "--strip-only",
        action="store_true",
        default=False,
        help="Remove PW-SEED prefixes and refresh images/copy without remapping to primary-batch names",
    )
    args = parser.parse_args()

    api_key = os.environ.get("PEXELS_API_KEY", "").strip()
    if not api_key:
        print("PEXELS_API_KEY missing from environment / .env", file=sys.stderr)
        return 1

    providers = get_all("/service-providers/public-info")
    products = get_all("/products")
    tagged_a = [
        a
        for a in providers
        if run_id_from_name(a.get("brandName") or a.get("businessName") or "")
    ]
    tagged_p = [p for p in products if run_id_from_name(p.get("name") or "")]
    primary_a = [
        a
        for a in tagged_a
        if run_id_from_name(a.get("brandName") or a.get("businessName") or "")
        == args.run_id
    ]
    primary_p = [p for p in tagged_p if run_id_from_name(p.get("name") or "") == args.run_id]

    print(
        f"Scope: primary {args.run_id} → {len(primary_a)} artisans, {len(primary_p)} products",
        flush=True,
    )
    print(
        f"Other tagged public leftovers: "
        f"{len(tagged_a) - len(primary_a)} artisans, {len(tagged_p) - len(primary_p)} products",
        flush=True,
    )

    if len(primary_a) != 20 or len(primary_p) != 100:
        print(
            f"WARNING: expected 20/100 for primary batch; found {len(primary_a)}/{len(primary_p)}. Proceeding with found set.",
            flush=True,
        )

    manifest: dict[str, Any] = {
        "apiBase": API,
        "primaryRunId": args.run_id,
        "startedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "artisans": [],
        "errors": [],
        "notes": [
            "Images from Pexels; attribution recorded per asset.",
            "All uploads verified < 2 MB before send.",
            "Record IDs preserved; updates via artisan-authenticated APIs only.",
        ],
    }

    # Discover artisan indexes 1..20 for primary run (and any present for orphan runs)
    run_ids = [args.run_id]
    if args.also_orphans:
        orphan_ids = sorted(
            {
                run_id_from_name(a.get("brandName") or a.get("businessName") or "")
                for a in tagged_a
            }
            - {args.run_id, None}
        )
        run_ids.extend(orphan_ids)

    for rid in run_ids:
        for index in range(1, 21):
            email = f"artisan{index:02d}.{rid}@moe-pw-seed.test"
            try:
                # Probe login; skip missing accounts quietly
                login(email, SEED_PASSWORD)
            except Exception:
                continue
            try:
                humanize_artisan(
                    run_id=rid,
                    index=index,
                    api_key=api_key,
                    manifest=manifest,
                    strip_only=args.strip_only or rid != args.run_id,
                )
            except Exception as e:
                msg = f"{email}: {e}"
                manifest["errors"].append(msg)
                print(f"✗ {msg}", flush=True)

    manifest["finishedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    updated = [a for a in manifest["artisans"] if not a.get("skipped")]
    skipped = [a for a in manifest["artisans"] if a.get("skipped")]
    manifest["artisansUpdated"] = len(updated)
    manifest["artisansSkipped"] = len(skipped)
    manifest["productsUpdated"] = sum(len(a.get("products") or []) for a in updated)
    manifest["imagesReplaced"] = sum(
        2 + len(a.get("products") or []) for a in updated
    )  # store+cover+products

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))
    print(
        f"\nDone. artisans={manifest['artisansUpdated']} products={manifest['productsUpdated']} "
        f"images≈{manifest['imagesReplaced']} errors={len(manifest['errors'])}",
        flush=True,
    )
    print(f"Manifest → {MANIFEST_PATH}", flush=True)
    return 0 if not manifest["errors"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
