import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { profileCompletion, type CompletionInput } from "@/lib/profileCompletion";

const ProfileCompletionCard = ({ profile }: { profile: CompletionInput }) => {
  const c = profileCompletion(profile);
  return (
    <Card className="mb-6 shadow-none" data-testid="profile-completion">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Profile completion — {c.percent}%</CardTitle>
        <CardDescription>Each item counts equally. Separate from document verification; doesn't grant a verified badge.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={c.percent} aria-label="Profile completion" />
        {c.missing.length ? (
          <p className="text-sm text-muted-foreground">Still to add: {c.missing.join(", ")}.</p>
        ) : <p className="text-sm text-muted-foreground">Your profile is complete.</p>}
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionCard;
