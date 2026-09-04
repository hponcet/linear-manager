# <issue id="33333333-3333-4333-8333-333333333333" href="https://linear.app/example/issue/EX-538/example">EX-538</issue> Markdown parity verification

## Marks

Paragraph with **bold**, *italic*, ~~strike~~, `inline code`, and [a named link](<https://example.com/path_(one)?q=a%20b>).

First visual line
Second visual line

> Quote
>
> > Nested quote

---

* Bullet
  * Nested bullet
    3. Ordered starts at three
* Second bullet

- [ ] Open task
- [X] Completed task
  - [ ] Nested task

| Name | Value | Empty |
| -- | -- | -- |
| Alpha | **Bold** |  |
| Code | `a|b` | [Link](<https://example.com/cell>) |

![Remote image](https://linear.app/favicon.ico)

![Data image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=)

>>> Details title

Inside **details**.

* Nested details list

>>>

```typescript
export const answer: number = 42
```

```mermaid
flowchart LR
  A[Start] --> B[Finish]
```

User: <user id="11111111-1111-4111-8111-111111111111">example.user</user>

Issue: [EX-1](<https://linear.app/example/issue/EX-1/example>)

Date fallback: 2026-09-01

![](https://www.youtube.com/watch?v=dQw4w9WgXcQ)

![](https://www.loom.com/share/1234567890abcdef)

![Private image](https://uploads.linear.app/00000000-0000-4000-8000-000000000000/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222?signature=fixture-token)

<linear-embed node-type="audio">{"uploadState":"finished","uploadId":null,"src":"https://uploads.linear.app/00000000-0000-4000-8000-000000000000/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222?signature=fixture-token","title":"fixture-tone.mp3","size":2003,"mimetype":"audio/mpeg","controls":true,"contentAttribution":{"userId":"11111111-1111-4111-8111-111111111111","actorType":"user_with_agent"}}</linear-embed>

<linear-embed node-type="video">{"uploadState":"finished","uploadId":null,"src":"https://uploads.linear.app/00000000-0000-4000-8000-000000000000/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222?signature=fixture-token","title":"fixture-clip.mp4","size":1854,"controls":true,"height":null,"width":null,"metadataId":null,"mimetype":"video/mp4","contentAttribution":{"userId":"11111111-1111-4111-8111-111111111111","actorType":"user_with_agent"}}</linear-embed>

<linear-embed node-type="file">{"uploadState":"finished","uploadId":null,"href":"https://uploads.linear.app/00000000-0000-4000-8000-000000000000/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222?signature=fixture-token","name":"fixture.png","size":21504,"mimetype":"image/png","contentAttribution":{"userId":"11111111-1111-4111-8111-111111111111","actorType":"user_with_agent"}}</linear-embed>
