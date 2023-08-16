# Babbling computer

A repository with tools for ~Large Language Model~ ChatBot independent assessment, and tools for data enrichement, visualization, and comparison.

The scripts normally works in conjunction with the servers (nocodb, etherpad, and other tools here available) installed in my server [babbling.computer](https://babbling.computer). **REMEMBER**: are all experiment free to fork and play with, **NO STABILITY GUARANTEE**, **ZERO RELIABILITY SHOULD BE EXPECTED**. It is my playground, it is broken until otherwise proven, and if something works is because of unexpected astral conjuction. And, of course, **DOCUMENTATION MIGHT CONTAIN FALSEHOOD**.

### Reminder

```
 721775 ?        Ss     0:18 tmux
 721778 pts/7    Ss     0:00  \_ -bash
 940770 pts/7    Sl+    9:29  |   \_ ./nocodb
 987866 pts/8    Ss     0:00  \_ -bash
1341484 pts/8    Sl+    4:42  |   \_ node src/node/server.js
1102455 pts/9    Ss+    0:00  \_ -bash
2512507 pts/11   Ss+    0:00  \_ -bash
```

### What and why?

**Metamorphic testing**, confortably described in this nice blogpost: https://www.giskard.ai/knowledge/how-to-test-ml-models-4-metamorphic-testing is the first attempt I made.

`<quoting>`

![](https://uploads-ssl.webflow.com/601d6f7e527cf16fd11a1aae/62d8824c19313d6e4bbc7b6a_Metamorphic%20testing.jpg)

_While the ML model maps an input (data example) to an output (scoring or classification labels), MT maps a perturbation relation between inputs to a metamorphic relation between outputs. For example, a metamorphic testing for credit scoring can be that if you switch the credit demander's gender from male to female (perturbation), the default probability should not increase (metamorphic relation)._

_Here are the most used metamorphic relations in the scientific literature:_

* _Invariance: metamorphic invariance relations mean that the output should remain invariant after the perturbation. A typical example is NLP classification, where one may want a prediction to remain invariant when switching synonyms in the input text (Ribeiro, 2020)._
* _Increasing: metamorphic increasing relations mean that the output should increase after perturbation. For example, the credit default score may increase when the bank account has less cash._
* _Decreasing: metamorphic decreasing relations mean that the output should decrease after perturbation. For example, the credit default score may decrease if the credit demander has a full-time job instead of a part-time job._

_In this case was also a necessary step to understand how to _distill_ information our of a large text corpus, because I don't want to read everything, because the `Distillation`/`Translation` tools have been developed to ingest the result of the `Production` tools_

`</quoting>`


### Use these scripts

1. Don't. barely the author can do it. Tools here are not tools and are not ready for public adoption.
2. This directory contains `package.json` for `npm` and `requirements.txt` for `pip`. You got it: it is like eating 🍫 with 🐟.

### Examples

1. go on OpenAI with TamperMonkey (or equivalent) and install the UserScript from [https://babbling.computer/chatGPT-collector.user.js](https://babbling.computer/chatGPT-collector.user.js).
2. produce [a pad](https://babbling.computer/p/33b38c8c-a51e-40c9-b2a8-552de311480d), like ID: `33b38c8c-a51e-40c9-b2a8-552de311480d`.
3. `portions/etherpad-to-semantic.mjs --pad 33b38c8c-a51e-40c9-b2a8-552de311480d`
4. `portions/semantic-to-noco.mjs --pad 33b38c8c-a51e-40c9-b2a8-552de311480d`
5. `portions/noco-to-observable.mjs --chatId !$`

### (data) Production tool n.1

Inspired by https://simonwillison.net/2023/May/18/cli-tools-for-llms/

```
python --version
python -m venv babbling
source babbling/bin/activate
pip install -r requirements.txt
```

Then you need to set the environment variable `OPENAPI_API_KEY`, and then, before sending queries, I used the `init-db` and `logs` commands:

```
$ python babbling/bin/llm init-db
$ python babbling/bin/llm "hi, please, can you tell me the number pi?"
Sure, the number pi is 3.14159265358979323846 (and so on, it is an irrational and never-ending decimal number).
$ python babbling/bin/llm logs
```

### (data) Production tool n.2

You should install [ViolentMonkey](https://violentmonkey.github.io/) or any other compatible tool that runs [Userscripts](https://en.wikipedia.org/wiki/Userscript)


