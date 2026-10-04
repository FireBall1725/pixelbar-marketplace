# Previews site

`previews.pixelbar.fireball1725.ca` shows each pull request's previews as a page: the GIFs and stills, and a player for every sound, so a reviewer can watch and listen without downloading anything. GitHub only plays media uploaded through its own comment box, which the bot can't use, so this fills the gap.

The files come from the repo's `previews` branch, written by the Post previews workflow. The Worker reads them from GitHub and serves them with the right content types.

| Address | What it shows |
| --- | --- |
| `/` | Every pull request that has previews |
| `/pr-12/` | Pull request 12's previews |
| `/pr-12/doorbell.mp4` | One file |

Anyone with the address can see these pages. They only hold LED renders of items proposed for the Marketplace.

## Setting it up

1. **Cloudflare.** In Workers & Pages, create from the `pixelbar-marketplace` repository with **root directory `worker`** and the deploy command `npx wrangler deploy`. The Cloudflare GitHub app is on "only select repositories", so add this repo to it first. The custom domain in `wrangler.jsonc` attaches on the first deploy.
2. **Optional: a token.** Without one, GitHub allows the Worker 60 API calls an hour, which the 60 second cache makes enough for a few reviewers. For more, make a fine-grained personal access token for the `pixelbar-marketplace` repository only, with **Contents: read**, and add it in the Worker's settings as the secret `GITHUB_TOKEN`.
3. **Tell the bot.** In the GitHub repo, Settings, Secrets and variables, Actions, add a repository **variable** `PREVIEWS_URL` = `https://previews.pixelbar.fireball1725.ca`. From then on each pull request comment starts with a link to its page.

## Running it locally

```sh
cd worker
npm install
npx wrangler dev                    # http://127.0.0.1:8787/pr-1/
```

Pages and files are cached for 60 seconds, so a pull request pushed again shows its new previews within a minute.
