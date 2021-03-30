# spaceranger

Webex Space Ranger Bot used to identify and remove participants from a space if they are not part of the same organisation as the registered Bot.
Allows organisations to have spaces without the need for moderation, but still keeping it contained to internal users.

Leverages the [webex-node-bot-framework](https://github.com/WebexSamples/webex-node-bot-framework)

## Deployment

1. Register a Bot at [Webex Developers](https://developer.webex.com/my-apps) for your Organisation
2. Deploy the app using a hosting solution or via Docker
3. Define the following Environment Variables (or .env file)
- WEBHOOK_URL=https://yourbotdomain.com/framework
- TOKEN=<token from developer.webex.com>
- PORT=3000
- SECRET=replacemwithasecretstring
4. Run the bot and add to spaces as needed
5. Enjoy!

## Support

In case you've found a bug, please [open an issue on GitHub](../../issues).

## Disclamer

This script is NOT guaranteed to be bug free and production quality.