<p align="center">
  <img width="630" height="250" src="https://github.com/toast-ts/Daggerbot-TS/assets/96593068/87a3c8b2-2209-42f0-851c-6cdebf9ef740">
  <h1 align="center">Daggerbot V3 Description</h1>

</p>
This is a repository for V3 revision that has been transitioned and rewritten from V2 bot to be more robust and reliable with today's standards.

This revision took **4 months** (Late September to Mid December) working on and off to do literally everything that needed a rewrite so badly that it cannot be done in V2.

**Q:** So what are the changes if it almost looks the same as V2?
**A:** Here's the bullet points of the changes so far;
- Reworked some of the files
- Commands and events are now classes
- Bot no longer stores short-term and long-term data locally
- Transitioned MongoDB schemas to PostgreSQL models
- MPModule got a facelift and rewritten from scratch
- Moved the module files to another directory called `modules`
- Renamed `funcs` to `components` as I don't think `funcs` directory makes sense anymore at this point.

If you're looking for V2 revision, it has been moved to a [branch called `old`](https://github.com/toast-ts/Daggerbot-TS/tree/old).

This is a revision history of how far we come in development cycle;
| Revision | Language | Library | Commands |
|---------|----------|-----------|----------|
| V1      | JavaScript | Discord.JS v13 | Message commands |
| V2-V3   | TypeScript | Discord.JS v14 | Slash/message commands |
