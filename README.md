# SkipMaster

SkipMaster is a simple static interval timer for skipping workouts. It runs a skipping timer, switches to a break timer, and then automatically starts the next skipping round.

## Features

- Start, pause, and reset controls
- Configurable skipping duration
- Configurable break duration
- Optional cycle limit, with `0` meaning unlimited rounds
- Vercel-ready static files with no build step

## Deploy to Vercel

This project does not need a framework preset or build command.

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New Project**.
3. Import the repository.
4. Leave the build command empty.
5. Set the output directory to `.` if Vercel asks.
6. Deploy.

If the Vercel CLI is available and logged in, deploy from this folder with:

```bash
vercel --prod
```
