import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Steps, Step } from "@/components/ui/steps"

export function WorkflowGuide() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>How to Create TikTok Videos</CardTitle>
        <CardDescription>Follow these steps to create and publish your TikTok videos</CardDescription>
      </CardHeader>
      <CardContent>
        <Steps>
          <Step number={1} title="Generate Card">
            Select a product and generate a card with AI-powered description
          </Step>
          <Step number={2} title="Preview and Customize">
            Preview the card and make any necessary adjustments
          </Step>
          <Step number={3} title="Take Screenshot or Screen Recording">
            Open the card in a new tab and take a screenshot or screen recording (5-6 seconds)
          </Step>
          <Step number={4} title="Edit and Enhance (Optional)">
            Use video editing tools to add music, effects, or transitions
          </Step>
          <Step number={5} title="Publish to TikTok">
            Upload the video to TikTok with the generated description
          </Step>
        </Steps>
      </CardContent>
    </Card>
  )
}
