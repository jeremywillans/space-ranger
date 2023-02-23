# space-ranger

Webex Space Ranger Bot used to identify and remove participants from a space if they are not part of the same organization as the registered Bot.
Allows organizations to have spaces without the need for moderation, but still keeping it contained to internal users.

## Deployment
1. Register a Bot at [Webex Developers](https://developer.webex.com/my-apps) for your Organization
2. Build and Deploy Docker Container (or deploy to Cloud)

    ```
    > docker build --tag space-ranger .
    > docker create --name space-ranger \
      -e TOKEN=bot-token-from-developer-dot-webex-dot-com \
      space-ranger

3. Verify Docker logs to ensure bot as started successfully.

### Environmental Variables

The following environmental variables can be used to customize the deployment of this app.

| Name | Required | Type | Default |  Description
| ---- | ---- | ---- | ---- | -------
| TOKEN | **Yes** | string |  | Bot Token from developer.webex.com
| DEBUG_SPACE | no | string |  | Webex Space to post Debug messages
| GUIDE_EMAILS | no | string |  | Email Address(s) required in space for bot to function
| WEBHOOK_URL | no | string |  | Inbound Webhook URL (must be externally reachable)
| SECRET | no | string |  | String used to authenticate Webhook
| PORT | no | int | `3000` | Port used by container
| APP_NAME | no | string | `space-ranger` | App Name used for Loki Logging
| LOKI_ENABLED | no | bool | `false` | Send Logs to external Loki server
| LOKI_HOST| no | string | `http://loki:3100` | Destination address for Loki server
| CONSOLE_LEVEL | no  | bool | `info` | Logging level exposed to Console

**Note:** Webhook Url, Secret and Port are listed as optional as this bot supports [Websockets](https://developer.webex.com/blog/using-websockets-with-the-webex-javascript-sdk) for connectivity

## Support
In case you've found a bug, please [open an issue on GitHub](../../issues).

## Credits
Leverages the [webex-node-bot-framework](https://github.com/WebexSamples/webex-node-bot-framework)

## Disclaimer
This script is NOT guaranteed to be bug free and production quality.