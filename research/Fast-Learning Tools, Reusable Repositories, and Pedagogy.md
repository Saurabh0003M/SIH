# Fast-Learning Tools, Reusable Repositories, and Pedagogy

## Executive finding

The market is successful but structurally fragmented. The strongest open-source projects cluster around separate functions—memory scheduling, coding practice, transcription, document Q&A, or walkthrough delivery—while proprietary products increasingly bundle adjacent functions. NotebookLM, StudyFetch, and RemNote come closest to integrated learning workspaces, but none forms a domain-neutral, open, end-to-end layer that reliably moves a learner from raw lecture or source material through diagnosis, scaffolded practice, independent performance, spaced review, and verified mastery.

“Learn in minimum time” should not mean compressing exposure alone. The strongest evidence supports **retrieval practice and distributed practice for retention**, **active participation for performance**, and **high initial guidance followed by adaptation or fading as expertise grows**.[^1][^2][^3][^4]

## Shortlist

**Scope and notation.** The list prioritizes established products and high-signal repositories, using public repository traction where available rather than claiming a single universal ranking. In the Category column, **S** means mostly single-purpose or one pipeline stage; **P** means a partial suite spanning several stages; **U** means the closest available approximation to a unified learning workspace. “Proprietary” means the product is usable but its application source is not offered under an open-source reuse license.

| Tool/Repo | What it does | Open-source? license | Category |
|---|---|---|---|
| **Anki / `ankitects/anki`** (~30.4k GitHub stars) | Mature desktop flashcards with active recall and spaced repetition; supports the modern FSRS scheduler as well as the older scheduler. | **Yes — AGPL-3.0-or-later** for Anki, with separately licensed bundled portions. Network distribution and derivative-work obligations make direct proprietary reuse non-trivial.[^5][^6][^7] | **S — memory / spaced repetition** |
| **AnkiDroid / `ankidroid/Anki-Android`** (~9.8k stars) | Android client/port for the Anki ecosystem. | **Yes — GPL-3.0**, with parts of the backend under AGPL-3.0 and the API under LGPL-3.0.[^8] | **S — mobile spaced repetition** |
| **FSRS4Anki / `open-spaced-repetition/fsrs4anki`** | Scheduler and optimizer that learn from review history to fit individual memory patterns; FSRS is now natively available in Anki. | **Yes — MIT**, making the scheduler logic substantially easier to reuse than AGPL application code.[^9][^10] | **S — scheduling engine** |
| **Mnemosyne / `mnemosyne-proj/mnemosyne`** | Desktop, research-oriented spaced-repetition flashcards and optional anonymized learning-data contribution. | **Yes — GPL-2.0**.[^11][^12] | **S — memory / spaced repetition** |
| **Logseq / `logseq/logseq`** (~44.8k stars) | Local-first knowledge graph and outlining environment with flashcard/review capability; stronger at connected notes than full instructional sequencing. | **Yes — AGPL-3.0**.[^13][^14] | **P — notes + knowledge graph + recall** |
| **Quizlet** | Large consumer flashcard product with user-created sets, interactive flashcards, practice tests, study activities, and conversion of slides/videos/notes into study aids. | **No — proprietary product**.[^15][^16] | **P — recall + generated study aids** |
| **RemNote** | Links notes and PDFs directly to flashcards, spaced repetition, AI card generation, quizzes, explanations, and exam-oriented scheduling. | **No — proprietary application**; public documentation, not a reusable application-code license.[^17][^18][^19] | **U — closest to unified notes-to-retention workspace** |
| **NotebookLM** | Source-grounded notebook that creates flashcards, quizzes, reports, explanations, Audio Overviews and other study aids from supplied documents or lecture material. | **No — proprietary Google product**.[^20] | **U — source ingestion + synthesis + Q&A + study aids** |
| **StudyFetch** | Records lectures, transcribes them, generates structured notes, supports real-time questions, and converts material into flashcards and quizzes. | **No — proprietary product**.[^21][^22][^23] | **U — lecture-to-study workflow** |
| **Otter.ai Education** | Records audio and provides real-time captions, transcripts, and notes for lectures or meetings. | **No — proprietary product**.[^24] | **S — capture + transcription/notes** |
| **Meetily / `Zackriya-Solutions/meeting-minutes`** (~7.9k stars) | Local capture, real-time transcription, diarization, and LLM summaries; meeting-oriented, but reusable as a privacy-first lecture-ingestion base. | **Yes — MIT**.[^25][^26] | **S — capture + transcription + summarization** |
| **Whishper / `pluja/whishper`** (~2.7k stars) | Fully local audio/video transcription, translation, subtitle editing, and web UI; it does not supply pedagogy or practice generation. | **Yes — AGPL-3.0**.[^27] | **S — transcription** |
| **Open Notebook / `lfnovo/open-notebook`** | Privacy-focused, self-hostable NotebookLM-style source notebook; useful as an ingestion, retrieval, and synthesis substrate. | **Yes — MIT**.[^28] | **P — source notebook + AI synthesis** |
| **Khoj / `khoj-ai/khoj`** (~37.2k stars) | Self-hostable personal AI that answers from local documents or the web and supports agents and research workflows. | **Yes — AGPL-3.0**.[^29][^30] | **P — personal knowledge Q&A / agents** |
| **freeCodeCamp / `freeCodeCamp/freeCodeCamp`** (~422k stars) | Free, self-paced coding curriculum combining interactive lessons, workshops, labs, quizzes, exams, and projects with automated tests. | **Partly — software is BSD-3-Clause; curriculum learning resources are copyrighted**, so do not assume the lessons themselves are freely reusable.[^31][^32][^33] | **P — guided learn-by-building curriculum** |
| **Exercism** (`website`, `problem-specifications`, language tracks) | Coding exercises with automated feedback and mentoring; particularly valuable as a reusable practice-content ecosystem. | **Mixed — website AGPL-3.0; shared problem specifications and many tracks MIT.** The website repo explicitly discourages reuse despite public source, so reuse the MIT exercise specifications rather than cloning the site.[^34][^35][^36] | **P — deliberate coding practice + feedback** |
| **Scrimba** | Interactive coding screencasts in which learners pause, edit, and run the instructor’s live code in place. | **No — proprietary platform/lesson format**; its public community repository is not the platform codebase.[^37][^38][^39] | **P — worked demonstration + immediate practice** |
| **Intro.js / `usablica/intro.js`** (~22.9k stars) | Embeddable step-by-step onboarding and feature tours for web applications. | **Yes — AGPL-3.0**, with a separate commercial license for proprietary commercial use.[^40][^41] | **S — in-product walkthrough delivery** |
| **Shepherd / `shipshapecode/shepherd`** (~13.3k stars) | Custom onboarding tours, training, and announcements, available as a standalone library or hosted/on-prem product. | **Yes — AGPL-3.0 for current versions**, with a commercial license for proprietary use; versions before v14 used different terms.[^42][^43][^44] | **S — in-product walkthrough delivery** |
| **Supademo** | Records a workflow and turns it into a clickable demo with hotspots, branching, voiceovers, embeds, and analytics. | **No — proprietary SaaS**.[^45][^46] | **P — walkthrough authoring + delivery analytics** |

### Reuse interpretation

For a startup prototype, the cleanest reusable building blocks in this shortlist are **FSRS4Anki (MIT)** for scheduling, **Meetily (MIT)** for local capture/transcription/summarization, **Open Notebook (MIT)** for source-grounded synthesis, and **Exercism problem specifications (MIT)** for coding-practice content. Strong-copyleft projects—Anki, Logseq, Khoj, Intro.js, and current Shepherd—remain reusable, but integrating or serving modified versions can trigger source-disclosure duties; legal review is prudent before using them inside a closed commercial product.[^5][^14][^30][^28][^43][^41][^26][^9][^35]

## Pedagogical evidence

| Construct | Foundational source and claim | Evidence status | Product-design implication |
|---|---|---|---|
| **Learning by doing / active learning** | Kolb’s 1984 model describes learning through concrete experience, reflective observation, abstract conceptualization, and active experimentation.[^47][^48] A 225-study STEM meta-analysis found active learning raised examination/concept-inventory performance by 0.47 SD and reduced failure relative to traditional lecturing.[^49][^2] | **Well-established in the broad, structured sense; Kolb’s exact universal four-stage cycle is contested.** A later experiential-learning meta-analysis found a mean advantage of d = 0.43, but reviews criticize ambiguity in “concrete experience” and call for further model testing.[^50][^51] Kolb’s Learning Style Inventory and some logical assumptions have substantial reliability/validity criticisms.[^52][^53] | Require the learner to predict, edit, build, explain, debug, or apply—not merely watch. Pair activity with feedback and reflection; do not implement “learning styles” matching as if it were established science. |
| **Scaffolding** | Wood, Bruner, and Ross’s 1976 tutoring study introduced scaffolding as support that lets a novice complete a task beyond unaided effort; functions included reducing degrees of freedom, directing attention, controlling frustration, and demonstrating.[^54] Later reviews identify contingency, fading, and transfer of responsibility as core properties.[^55] | **Well-established as an instructional design principle; implementation and measurement remain contested.** A decade review found relatively few effectiveness studies and called for more research, while computer-based evidence shows positive average effects but warns that fixed fading can underperform no fading.[^55][^56] | Diagnose before helping; offer the smallest useful hint, example, or decomposition; reduce assistance only after demonstrated competence. Static hint ladders are weaker than contingent support. |
| **Vygotsky’s zone of proximal development** | Vygotsky’s *Mind in Society* frames development around what a learner can do with guidance versus independently; it is the theoretical ancestor of instruction targeted just beyond current unaided ability.[^57][^58] | **Foundational and highly influential, but empirically under-specified/contested as a measurable construct.** A critical review found only 3 of 15 quantitative studies included the pretest, assisted problem-solving activity, and posttest needed to make a specific ZPD claim.[^59] | Maintain a live learner model based on observed attempts. Route tasks to the boundary between already-mastered and currently impossible, rather than assigning one static difficulty level. |
| **Worked-example effect** | Sweller and Cooper’s 1985 experiments compared worked examples with conventional algebra problem solving; subsequent cognitive-load research explains that examples reduce ineffective search so novices can study solution structure.[^60][^1] | **Well-established for novices in structured domains.** Reviews describe a large body of studies showing better learning/transfer and lower time or mental effort than conventional problem solving for novice learners.[^1][^61] The benefit can reverse as expertise grows, when explanations become redundant.[^62] | Begin unfamiliar procedures with annotated, step-by-step demonstrations. Avoid forcing novices into blank-canvas problem solving; stop over-explaining once the learner has a usable schema. |
| **Example fading / guidance fading** | Renkl et al. progressively removed worked solution steps until learners solved complete problems. Their 2002 studies supported near transfer, while far transfer remained unclear; 2004 work linked fading to fewer unproductive learning events.[^63][^64] | **Well-established as a novice-to-independence pattern, but conditional rather than universally superior.** Expertise reversal supports reducing guidance as knowledge rises, yet fixed, non-contingent fading can be inferior to maintaining support.[^65][^56] | Use a sequence such as **show → complete missing final step → complete several steps → solve independently → explain/transfer**. Trigger fading from mastery evidence, not elapsed time or a fixed lesson index. |

### Important boundary

“Learning by doing” does **not** imply unguided discovery. Kirschner, Sweller, and Clark argue that minimal guidance is less effective and less efficient for novices, with the advantage of explicit guidance receding only when prior knowledge can supply internal guidance. The coherent evidence-based pattern is therefore **guided activity first, progressively less support later**—not passive lecture, but also not immediate blank-page exploration.[^66]

For memory-heavy learning, retrieval and spacing deserve equal status with doing. Roediger and Karpicke found that restudy looked better after five minutes, but retrieval practice produced substantially greater retention after two days or one week; a broad review rated practice testing and distributed practice as high-utility techniques across ages, abilities, tasks, and educational contexts. Cepeda et al.’s quantitative synthesis covered 839 assessments from 317 experiments and found that effective spacing depends jointly on the inter-study interval and desired retention interval.[^3][^4][^67]

## Fragmentation map

### Clearly single-purpose

- **Retention engines:** Anki, AnkiDroid, Mnemosyne, and FSRS primarily optimize review and recall. They do not natively capture a lecture, build a verified concept model, teach a new procedure through faded examples, or assess authentic transfer.[^6][^8][^11][^9]
- **Capture/transcription:** Otter, Meetily, and Whishper convert speech or media to text and sometimes summaries, but transcription is not instruction and summaries are not retrieval practice.[^24][^25][^27]
- **Coding practice:** freeCodeCamp, Exercism, and Scrimba provide strong domain-specific activity and feedback, but their pedagogical assets do not generalize automatically to DBMS, networking, electronics, law, or medicine.[^37][^68][^36]
- **Walkthrough infrastructure:** Intro.js and Shepherd deliver tours; they do not diagnose prior knowledge, verify understanding, schedule review, or adapt guidance from mastery data.[^42][^40]

### Partial integration

- **Logseq and RemNote** connect notes to recall, reducing the classic split between a notebook and a flashcard queue; RemNote adds AI generation and exam scheduling, but neither supplies a general simulation/practice engine for arbitrary procedural skills.[^13][^19]
- **NotebookLM** connects sources to explanations and generated study aids, while **StudyFetch** connects live lectures to notes, Q&A, flashcards, and quizzes. These are the nearest consumer-level unifications, but they remain closed platforms and their public materials do not establish a full mastery model with adaptive example fading, authentic task execution, and longitudinal transfer measurement.[^20][^22]
- **Open Notebook and Khoj** offer reusable source-grounded synthesis and personal Q&A, but require a separate pedagogical orchestration layer for retrieval schedules, adaptive practice, rubrics, and mastery decisions.[^29][^28]

## Real product gaps

### Unified learner state

No shortlisted open-source stack maintains one portable model connecting **source provenance, concepts, misconceptions, task attempts, hint usage, confidence, retention probability, and transfer performance** across tools. Current products typically maintain either a note graph, a flashcard review history, a transcript, or exercise submissions—not a common learner-state layer.

A defensible opportunity is an open event and competency schema: every interaction records the source concept, task, answer, latency, hints requested, rubric result, confidence, and next review. This would let an FSRS-like scheduler use more than binary card recall and let tutoring guidance respond to actual procedural competence.

### Capture-to-practice integrity

Lecture products can rapidly generate notes and cards, but the unresolved problem is **quality control**: detecting omissions, hallucinated claims, badly scoped cards, ambiguous questions, and content that is memorable but not important. NotebookLM grounds generated aids in user sources, which helps provenance, but source grounding alone does not prove pedagogical quality or factual correctness of the uploaded source.[^20]

A stronger layer would align transcript segments with slides/readings, extract a concept and prerequisite graph, preserve citations on every generated artifact, ask the learner to approve high-stakes cards, and automatically flag low-confidence transcription or contradictory sources.

### Adaptive scaffolding

Most “interactive” tools are interactive only at the interface level: click next, edit code, answer a quiz, or request a hint. Pedagogical scaffolding requires contingency, fading, and transfer of responsibility, yet research warns that fixed fading can underperform adaptive or continued support.[^55][^56]

The gap is a domain-neutral scaffold policy that selects among a worked example, partial completion, hint, subgoal label, misconception explanation, analogous problem, or independent challenge based on evidence of mastery. It should also restore guidance after failure rather than fading monotonically.

### Authentic transfer

Flashcards test recall, generated quizzes often test recognition, and walkthroughs test navigation. The harder outcome is whether the learner can solve a novel problem, configure a network, write a secure program, diagnose a circuit, or explain a system under changed conditions. Example-fading evidence is clearest for near transfer and less clear for far transfer.[^63][^69]

An integrated layer should therefore end every concept path with a novel, minimally cued performance task and score the process—not only the final answer. For software and cybersecurity, sandboxes, unit tests, packet traces, terminal telemetry, and rubric-based explanations make this practical.

### Cross-tool portability

There is no broadly adopted interchange standard spanning notes, source citations, flashcards, review logs, concept graphs, code exercises, walkthrough steps, and mastery evidence. Open-source components exist, but AGPL obligations, proprietary formats, and copyrighted curricula complicate assembly.[^32][^34][^5]

A practical startup wedge is not “another all-in-one notes app.” It is a **learning orchestration layer** that imports existing artifacts (Anki decks, Markdown notes, PDFs, lecture audio, Git repositories), preserves provenance, dispatches activities to specialized engines, and exports learner-owned history in an open format.

## Buildable architecture

For a reusable, startup-friendly prototype, combine:

- **Capture:** Meetily’s MIT-licensed local audio/transcription pipeline.[^25][^26]
- **Grounded workspace:** Open Notebook’s MIT-licensed source notebook, or a clean-room retrieval pipeline if stronger control is needed.[^28]
- **Memory scheduler:** FSRS4Anki’s MIT scheduler concepts/implementation.[^9]
- **Practice content:** Exercism’s MIT problem specifications for an initial coding/cybersecurity vertical; use freeCodeCamp software cautiously because its curriculum content is separately copyrighted.[^35][^32]
- **Pedagogical policy:** a new mastery service that implements worked examples, completion tasks, adaptive hints, fading, delayed retrieval, and transfer challenges based on observed performance.[^63][^1][^66]
- **Walkthrough UI:** either build a permissively licensed minimal tour component or comply with AGPL/commercial terms for Intro.js or Shepherd.[^43][^41]

The strongest differentiated claim would be: **one evidence-driven progression from “I encountered this” to “I can recall it, use it with support, perform it independently, and transfer it later.”** Existing successful tools validate each component of that journey, but the open, interoperable orchestration and learner-state layer remains the central gap.

---

## References

1. [Cognitive Load Theory: Advances in Research on Worked Examples, Animations, and Cognitive Load Measurement](https://link.springer.com/article/10.1007/s10648-010-9145-4) - The contributions to this special issue document some recent advances of cognitive load theory, and ...

2. [Active learning increases student performance in science, ...](https://pubmed.ncbi.nlm.nih.gov/24821756/) - To test the hypothesis that lecturing maximizes learning and course performance, we metaanalyzed 225...

3. [Improving Students’ Learning With Effective Learning Techniques - John Dunlosky, Katherine A. Rawson, Elizabeth J. Marsh, Mitchell J. Nathan, Daniel T. Willingham, 2013](https://journals.sagepub.com/doi/10.1177/1529100612453266) - Many students are being left behind by an educational system that some people believe is in crisis. ...

4. [Test-Enhanced Learning - Henry L. Roediger, Jeffrey D. Karpicke, 2006](https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x) - Taking a memory test not only assesses what one knows, but also enhances later retention, a phenomen...

5. [anki/LICENSE at main - GitHub](https://github.com/ankitects/anki/blob/main/LICENSE) - Anki is a smart spaced repetition flashcard program. Anki is licensed under the GNU Affero General P...

6. [ankitects/anki: Anki is a smart spaced repetition flashcard program](https://github.com/ankitects/anki) - Anki is a smart spaced repetition flashcard program. This repo contains the source code for the comp...

7. [What spaced repetition algorithm does Anki use?](https://faqs.ankiweb.net/what-spaced-repetition-algorithm) - Frequently asked questions about Anki. Anki is a program that makes learning easier.

8. [GitHub - ankidroid/Anki-Android: AnkiDroid: Anki flashcards on Android. Your secret trick to achieve superhuman information retention.](http://github.com/ankidroid/Anki-Android) - AnkiDroid: Anki flashcards on Android. Your secret trick to achieve superhuman information retention...

9. [open-spaced-repetition/fsrs4anki: A modern Anki custom ...](https://github.com/open-spaced-repetition/fsrs4anki) - A modern Anki custom scheduling based on Free Spaced Repetition Scheduler algorithm - open-spaced-re...

10. [fsrs4anki/docs/tutorial.md at main · open-spaced-repetition/fsrs4anki](https://github.com/open-spaced-repetition/fsrs4anki/blob/main/docs/tutorial.md) - A modern Anki custom scheduling based on Free Spaced Repetition Scheduler algorithm - open-spaced-re...

11. [Mac](https://github.com/mnemosyne-proj/mnemosyne) - Mnemosyne: efficient learning with powerful digital flash-cards. - mnemosyne-proj/mnemosyne

12. [Mnemosyne Project - flash-card tool - LinuxLinks](https://www.linuxlinks.com/mnemosyneproject/) - Mnemosyne software resembles a traditional flash-card program to help you memorise question/answer p...

13. [GitHub - logseq/logseq: A privacy-first, open-source ...](https://github.com/logseq/logseq) - A privacy-first, open-source platform for knowledge management and collaboration. Download link: htt...

14. [logseq/LICENSE.md at master · logseq/logseq](https://github.com/logseq/logseq/blob/master/LICENSE.md) - A privacy-first, open-source platform for knowledge management and collaboration. Download link: htt...

15. [How do you want to study?](https://quizlet.com/) - Quizlet makes learning fun and easy with free flashcards and premium study tools. Join millions of s...

16. [Cookie Settings](https://quizlet.com/gb/features/spaced-repetition) - Quizlet brings the power of spaced repetition to help you retain information and study more effectiv...

17. [Flashcard Basics](https://help.remnote.com/en/articles/8663109-flashcard-basics) - Learn how to get started using flashcards to memorize the most important parts of your notes.

18. [Flashcard Maker for Notes & PDFs | Generate AI ...](https://www.remnote.com/feature/flashcard-maker) - Turn notes, PDFs, or slides into smart flashcards fast. An AI flashcard maker that boosts grades, re...

19. [Study Faster with AI Flashcards, Quizzes & Summaries](https://www.remnote.com/) - Upload PDFs, videos, or notes and instantly generate AI flashcards, quizzes, summaries, and explanat...

20. [6 ways to use NotebookLM to master any subject - Google Blog](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-student-features/) - This semester, students can use NotebookLM to instantly generate flashcards, quizzes, professional r...

21. [AI Live Lecture Notes | The Best AI Tools for Learning - StudyFetch](https://www.studyfetch.com/features/live-lecture) - Record your lectures and never miss a word. Hit record during class and Sparky listens, transcribes,...

22. [Real-time AI Notes During Lectures - StudyFetch](https://www.studyfetch.com/section/real-time-ai-notes-during-lectures) - With StudyFetch, you can generate notes, flashcards, and quizzes from your course materials, get ins...

23. [Live AI Note-Taker for Lectures - StudyFetch](https://www.studyfetch.com/section/live-ai-note-taker-for-lectures) - With StudyFetch, you can generate notes, flashcards, and quizzes from your course materials, get ins...

24. [Lecture Notes - Real-time for Students & Teachers - Otter.ai](https://otter.ai/education) - Otter for Education is designed for higher level education institutions and includes integrated acco...

25. [GitHub - Zackriya-Solutions/meeting-minutes: A free and ...](https://github.com/Zackriya-Solutions/meeting-minutes) - A free and open source, self hosted Ai based live meeting note taker and minutes summary generator t...

26. [meeting-minutes/LICENSE.md at main · Zackriya-Solutions/meeting-minutes](https://github.com/Zackriya-Solutions/meeting-minutes/blob/main/LICENSE.md) - A free and open source, self hosted Ai based live meeting note taker and minutes summary generator t...

27. [pluja/whishper: Transcribe any audio to text, translate and ... - GitHub](https://github.com/pluja/whishper) - Transcribe any audio to text, translate and edit subtitles 100% locally with a web UI. Powered by wh...

28. [An Open Source implementation of Notebook LM with more ... - GitHub](https://github.com/lfnovo/open-notebook) - An open source, privacy-focused alternative to Google's Notebook LM! License Open Notebook is MIT li...

29. [GitHub - khoj-ai/khoj: Your AI second brain. Self-hostable. Get ...](https://github.com/khoj-ai/khoj) - Khoj is a personal AI app to extend your capabilities. It smoothly scales up from an on-device perso...

30. [khoj/LICENSE at master · khoj-ai/khoj](https://github.com/khoj-ai/khoj/blob/master/LICENSE) - Your AI second brain. Self-hostable. Get answers from the web or your docs. Build custom agents, sch...

31. [GitHub - freeCodeCamp/freeCodeCamp: freeCodeCamp.org's open-source codebase and curriculum. Learn math, programming, and computer science for free.](http://github.com/freeCodeCamp/freeCodeCamp) - freeCodeCamp.org's open-source codebase and curriculum. Learn math, programming, and computer scienc...

32. [freeCodeCamp/README.md at main · freeCodeCamp/freeCodeCamp](https://github.com/freeCodeCamp/freeCodeCamp/blob/main/README.md) - freeCodeCamp.org's open-source codebase and curriculum. Learn to code for free. - freeCodeCamp/freeC...

33. [freeCodeCamp.org's open-source codebase and ...](https://github.com/FreeCodeCamp/freecodecamp) - freeCodeCamp.org's open-source codebase and curriculum. Learn math, programming, and computer scienc...

34. [The codebase for Exercism's website. - GitHub](https://github.com/exercism/website) - AGPL-3.0 license Security. This repo is an internal repo. Exercism Tests Maintainability View perfor...

35. [MIT License - exercism/problem-specifications · GitHub](https://github.com/exercism/problem-specifications/blob/main/LICENSE) - A short and simple permissive license with conditions only requiring preservation of copyright and l...

36. [exercism/problem-specifications: Shared metadata for ... - GitHub](https://github.com/exercism/problem-specifications) - Repository for practice exercises to be used across tracks. This includes both problem statements av...

37. [Scrimba.com: Learn to Code with Interactive Tutorials](https://v1.scrimba.com/) - Scrimba is a fun and fast way of learning to code! Our interactive courses and tutorials will teach ...

38. [community/FAQ.md at master · scrimba/community](https://github.com/scrimba/community/blob/master/FAQ.md) - Repository for public issue-tracking and discussions - scrimba/community

39. [How Scrimba Scrims Work | Scrimba Guide](https://scrimbaguide.tech/docs/how-it-works/how-scrims-work/) - Learn how Scrimba's unique interactive scrims merge a code editor with video tutorials. Pause, edit,...

40. [usablica/intro.js: Lightweight, user-friendly onboarding tour library](https://github.com/usablica/intro.js/) - If you want to use Intro.js for a commercial application, theme or plugin the commercial license is ...

41. [intro.js/license.md at master · usablica/intro.js](https://github.com/usablica/intro.js/blob/master/license.md) - Lightweight, user-friendly onboarding tour library - usablica/intro.js

42. [shipshapecode/shepherd: Guide your users through a tour of your app](https://github.com/shipshapecode/shepherd) - Shepherd makes it simple to create custom user on-boarding tours, trainings and announcements to dri...

43. [shepherd/LICENSE.md at main · shipshapecode/shepherd](https://github.com/shipshapecode/shepherd/blob/main/LICENSE.md) - Guide your users through a tour of your app. Contribute to shipshapecode/shepherd development by cre...

44. [Releases · shipshapecode/shepherd](https://github.com/shipshapecode/shepherd/releases) - Guide your users through a tour of your app. Contribute to shipshapecode/shepherd development by cre...

45. [Supademo: AI Interactive Product Demos](https://supademo.com/) - Create world-class interactive product demos with AI. Trusted by 200k+ businesses to drive revenue, ...

46. [Supademo Product Features](https://supademo.com/features) - Features designed to help drive product adoption, increase awareness, and drive growth.

47. [Experiential learning : experience as the source of learning and development](https://searchworks.stanford.edu/view/1506852) - Stanford Libraries' official online search tool for books, media, journals, databases, government do...

48. [The Challenge of Designing ‘More’ Experiential Learning in Higher Education Programs in the Field of Teacher Education: A Systematic Review Study](https://www.tandfonline.com/doi/full/10.1080/02601370.2021.1994664) - Although a long time has passed since the theoretical foundation of experiential learning was propos...

49. [Active learning increases student performance in science ...](http://www.dis.fi/pdfs/PNAS-1319030111.pdf)

50. [A Meta‐Analysis of the Relationship Between Experiential Learning and Learning Outcomes](https://onlinelibrary.wiley.com/doi/10.1111/dsji.12188)

51. [Experiential learning – a systematic review and revision of ...](https://www.tandfonline.com/doi/full/10.1080/10494820.2019.1570279) - Kolb’s experiential learning cycle is perhaps the most scholarly influential and cited model regardi...

52. [Kolb's Experiential Learning Model: Critique from a Modeling Perspective.](https://eric.ed.gov/?id=EJ880653) - Kolb's experiential learning theory has been widely influential in adult learning. The theory and as...

53. [Kolb’s Learning Style Inventory: Issues of Reliability and Validity - Jeffrey J. Koob, Joanie Funk, 2002](https://journals.sagepub.com/doi/10.1177/104973150201200206) - Kolb’s Learning Style Inventory (LSI) is a very popular assessment tool despite compelling arguments...

54. [the-role-of-tutoring-in-problem-solving - Ask this paper](https://www.bohrium.com/paper-details/the-role-of-tutoring-in-problem-solving/812036802587131905-6852) - Download the full PDF of THE ROLE OF TUTORING IN PROBLEM SOLVING *. Includes comprehensive summary, ...

55. [Scaffolding in Teacher-Student Interaction: A Decade of Research.](https://eric.ed.gov/?id=EJ924182) - Although scaffolding is an important and frequently studied concept, much discussion exists with reg...

56. [A Pilot Meta-Analysis of Computer-Based Scaffolding in STEM Education.](https://eric.ed.gov/?id=EJ1062484) - This paper employs meta-analysis to determine the influence of computer-based scaffolding characteri...

57. [Mind in Society - Florida Atlantic University](https://home.fau.edu/musgrove/web/vygotsky1978.pdf)

58. [Book Detail Page](https://www.per-central.org/items/detail.cfm?ID=16145) - This book contains a compendium of essays by influential psychologist L.S. Vygotsky, recognized as t...

59. [The Use of Vygotsky's Theory of the Zone of Proximal Development in Quantitative Research: A Critical Review.](https://eric.ed.gov/?id=ED398609) - This review critiques the use of Lev Vygotsky's concept of the zone of proximal development (ZPD) in...

60. [Sweller, J., & Cooper, G. A. (1985). The Use of Worked Examples as ...](https://notes.andymatuschak.org/zYHdLJ7TFdpcwGtqDChMNbm) - The first paper to suggest Worked example effect (AFAICT), by John Sweller and Graham Cooper. The pa...

61. [Cognitive load theory: Research that teachers really need to understand](https://education.nsw.gov.au/content/dam/main-education/about-us/educational-data/cese/2017-cognitive-load-theory.pdf)

62. [[PDF] The Expertise Reversal Effect - lexiconic.net](http://lexiconic.net/pedagogy/2003-Kalyuga_et_al.pdf)

63. [ERIC - EJ658398 - From Example Study to Problem Solving](https://eric.ed.gov/?id=EJ658398) - Proposed a successive integration of problem-solving elements into example study until learners solv...

64. [EJ732331 - How Fading Worked Solution Steps Works--A Cognitive ...](https://eric.ed.gov/?id=EJ732331) - In order to facilitate the transition from learning from worked examples in earlier stages of skill ...

65. [The expertise reversal effect and worked examples in ...](http://www.cee.uma.pt/ron/Salden%20et%20al.%20-%20The%20Expertise%20Reversal%20Effect%20and%20Worked%20Examples.pdf)

66. [EJ736299 - Why Minimal Guidance during Instruction ... - ERIC](https://eric.ed.gov/?id=EJ736299) - Evidence for the superiority of guided instruction is explained in the context of our knowledge of h...

67. [Distributed practice in verbal recall tasks: A review and quantitative ...](https://bibbase.org/network/publication/cepeda-pashler-vul-wixted-rohrer-distributedpracticeinverbalrecalltasksareviewandquantitativesynthesis-2006) - The authors performed a meta-analysis of the distributed practice effect to illuminate the effects o...

68. [GitHub - freeCodeCamp/freeCodeCamp: freeCodeCamp.org's open-source codebase and curriculum. Learn to code for free.](https://github.com/FreeCodeCamp/FreeCodeCamp/) - freeCodeCamp.org's open-source codebase and curriculum. Learn to code for free. - freeCodeCamp/freeC...

69. [[PDF] From Example Study to Problem Solving: Smooth - David Lewis, PhD](http://www.davidlewisphd.com/courses/EDD8121/readings/2002-Renkl_et_al.pdf) - Renkl, Atkinson, Maier, & Staley. 295 tiveness of learning from worked-out ... In the fading group, ...

