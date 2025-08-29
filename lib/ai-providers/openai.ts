import OpenAI from 'openai'

export class OpenAIProvider {
  private client: OpenAI

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY
    })
  }

  async generateReply(tweetText: string, tweetAuthor: string): Promise<string[]> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a social media engagement expert helping to create compelling Twitter/X replies. 
            Generate authentic, engaging responses that:
            - Are conversational and natural
            - Add value to the discussion
            - Are appropriate in tone and content
            - Stay under 280 characters
            - Don't include hashtags unless absolutely relevant
            - Show genuine interest or provide helpful insights
            
            Generate exactly 3 different reply options with varying approaches (supportive, insightful, engaging).`
          },
          {
            role: 'user',
            content: `Create engaging reply options for this tweet by @${tweetAuthor}:

"${tweetText}"

Return exactly 3 reply options, each on a separate line, numbered 1-3.`
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      })

      const content = completion.choices[0]?.message?.content || ''
      
      // Parse numbered responses
      const suggestions = content
        .split('\n')
        .filter(line => /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 3)

      return suggestions.length > 0 ? suggestions : ['Great point! Thanks for sharing your perspective.']
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error('Failed to generate reply suggestions')
    }
  }
}