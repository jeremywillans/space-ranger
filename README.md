# space-ranger

Webex Space Ranger Bot used to identify and remove participants from a space if they are not part of the same organization as the registered Bot.
Allows organizations to have spaces without the need for moderation, but still keeping it contained to internal users.

## Deployment
1. Register a Bot at [Webex Developers](https://developer.webex.com/my-apps) for your Organization
2. Build and Deploy Docker Container (or deploy to Cloud)

    **Note:** Webhook, Secret and Port can be omitted if you want to use Websockets.

    ```
    > docker build --tag space-ranger .
    > docker create --name space-ranger \
      -e TOKEN=bot-token-from-developer-dot-webex-dot-com \
      (optional) -e WEBHOOK_URL=https://yourdomain.com/framework \
      (optional) -e SECRET=replace-me-with-a-secret-string \
      (optional) -e PORT=3000 \
      (optional) -e GUIDE_EMAILS=comma-separated-list-of-person-in-space-to-function \
      space-ranger

3. Verify Docker logs to ensure bot as started successfully.

## Support
In case you've found a bug, please [open an issue on GitHub](../../issues).

## Credits
Leverages the [webex-node-bot-framework](https://github.com/WebexSamples/webex-node-bot-framework)

## Disclaimer
This script is NOT guaranteed to be bug free and production quality.