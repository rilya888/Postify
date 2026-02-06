/**
 * Series context for multi-post generation (Enterprise).
 * Returns role-specific instructions for post 1 (teaser), 2 (context), or 3 (conclusion).
 * For seriesTotal === 2: index 1 = teaser, index 2 = conclusion.
 */

export function getSeriesContext(seriesIndex: number, seriesTotal: number): string {
  if (seriesTotal <= 1) return "";

  const role = seriesTotal === 2
    ? (seriesIndex === 1 ? "teaser" : "conclusion")
    : (seriesIndex === 1 ? "teaser" : seriesIndex === 2 ? "context" : "conclusion");

  const contexts: Record<string, string> = {
    teaser: `You are creating POST 1 of ${seriesTotal} in a series.

CRITICAL RULES FOR POST 1:
- Create intrigue and curiosity.
- DO NOT reveal the main conclusion or solution.
- Hint at the problem or topic without explaining it fully.
- Use a hook that makes people want to see the next post.
- End with a cliffhanger or question.
- You may mention "Part 1 of ${seriesTotal}" or "First in a series".

WHAT TO INCLUDE:
- A compelling hook or surprising statistic.
- The PROBLEM (without the solution).
- A hint that more is coming.

WHAT TO AVOID:
- Do not give the full answer.
- Do not explain the solution.
- Do not include the main CTA yet.
- Keep them wanting more.`,

    context: `You are creating POST 2 of ${seriesTotal} in a series.

CRITICAL RULES FOR POST 2:
- Build on the intrigue from Post 1.
- Provide more context and details.
- Still DO NOT reveal the final conclusion.
- Create anticipation for the final post.
- Reference what was discussed in Post 1.
- You may mention "Part 2 of ${seriesTotal}".

WHAT TO INCLUDE:
- Acknowledgment of Post 1's hook.
- Deeper exploration of the problem/topic.
- Additional insights or data.
- Framework or approach (but not full solution).

WHAT TO AVOID:
- Do not give away the final conclusion.
- Do not include the main CTA yet.
- Do not repeat Post 1 exactly.`,

    conclusion: `You are creating the FINAL post (Post ${seriesIndex} of ${seriesTotal}) in this series.

CRITICAL RULES FOR THIS POST:
- Deliver the payoff from the previous posts.
- Provide the complete solution or conclusion.
- Include a strong Call-to-Action.
- Tie everything together.
- You may mention "Part ${seriesIndex} of ${seriesTotal}" or "Final post in series".

WHAT TO INCLUDE:
- Brief recap of what was covered in earlier posts.
- The FULL solution, conclusion, or answer.
- Actionable takeaways.
- Strong CTA (link, comment, DM, etc.).`,
  };

  return contexts[role] ?? contexts.teaser;
}
