<div align="center">
	<img width="125" alt="PowerBots" src="https://github.com/user-attachments/assets/9182c539-a992-407c-9ce5-df2cf7d93baf" />
	<h1>PowerBotsLibrary</h1>
</div>
PowerBotsLibrary is the core of all Power Bots and makes up the foundation to share code.

## Install
```
npm install @power-bots/powerbotlibrary
```

## Usage
```typescript
import { bot } from "@power-bots/powerbotlibrary"
import { knex } from "@power-bots/powerbotlibrary" // If you want to use database

bot.setup(__dirname)
bot.run()
```

More documentation will be available soon.
