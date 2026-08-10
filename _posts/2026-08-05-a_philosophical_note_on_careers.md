---
layout: post
title: "A Philosophical Note on Careers: An Interview"
author: Anirudh Gupta
permalink: /career-interview/
categories: [stories]
image: "/assets/images/Stories/philosophical_note_careers.jpg"
excerpt: "An AI interviews a fourth-year undergraduate on what 'having a career' really means once you stop taking the sentence at face value, breadth vs. depth, borrowed dreams, and what's still worth mastering when AI can do the rest."
description: "A long-form interview between an AI and a student on how to actually think about a career: breadth vs. depth, love vs. inherited love, and the meaning hidden inside every 'YOU THINK'."
featured: true
---

<style>
  /* ============================================================
     Interview thread, an AI (left) in dialogue with a human
     (right). Each turn is a clean, bordered box with a header
     bar naming the speaker. No fills, no tint inside. Cards are
     offset toward their own side and overlap horizontally.
     ============================================================ */
  .qa-thread { max-width: 860px; margin: 2.5rem auto 1rem; }

  .qa-intro {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 1.3rem;
    line-height: 1.65;
    color: var(--text-color);
    text-align: center;
    max-width: 680px;
    margin: 0 auto 3rem;
    padding: 0 1rem;
  }

  .qa { margin: 0 0 1.9rem; }

  .qa-card {
    border-radius: 14px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.07);
    overflow: hidden;
  }

  .qa-head {
    display: flex;
    align-items: center;
    padding: 0.8rem 1.4rem;
    background: var(--qa-tint);
    border-bottom: 1px solid var(--border-color);
    font-family: 'Inter', sans-serif;
    font-weight: 800;
    font-size: 1.02rem;
    color: var(--qa-c);
  }
  .qa-head .qa-tag {
    margin-left: auto;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.62rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .qa-body {
    padding: 1.2rem 1.5rem;
    line-height: 1.78;
    font-size: 1.05rem;
    color: var(--text-color);
  }
  .qa-body > :first-child { margin-top: 0; }
  .qa-body > :last-child { margin-bottom: 0; }

  .qa-body blockquote {
    margin: 1.1rem 0;
    padding: 0.4rem 0 0.4rem 1.1rem;
    border-left: 3px solid var(--qa-c);
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 1.14rem;
    line-height: 1.55;
  }
  .qa-body hr {
    border: 0;
    height: 1px;
    background: var(--border-color);
    opacity: 0.7;
    margin: 1.4rem auto;
    width: 42%;
  }

  .you-think {
    color: var(--link-color);
    font-weight: 800;
  }

  /* The site applies a drop-cap to the first <p> of every element
     (p:first-of-type is scoped per-parent, so it fires inside every
     .qa-body and blockquote too). Kill it everywhere in this thread.
     .qa-thread is doubled to out-specify the dark-mode !important
     rule (which otherwise wins the color fight even against our own
     !important, since it has more classes in its selector). */
  .qa-thread.qa-thread p:first-of-type::first-letter,
  .qa-thread.qa-thread .dropcap::first-letter {
    float: none !important;
    font-family: inherit !important;
    font-size: inherit !important;
    line-height: inherit !important;
    padding: 0 !important;
    color: inherit !important;
    font-weight: inherit !important;
  }

  /* Belt-and-suspenders: force the you-think blue to survive even
     on the letter the drop-cap rule singles out. */
  .qa-thread.qa-thread span.you-think::first-letter {
    color: var(--link-color) !important;
  }

  /* AI, questions: hug the left, small gap on the right only */
  .qa--q {
    --qa-c: #6366f1;
    --qa-tint: rgba(99, 102, 241, 0.12);
    margin-left: 0;
    margin-right: 8%;
  }

  /* Human, answers: hug the right, small gap on the left only */
  .qa--a {
    --qa-c: #0d9488;
    --qa-tint: rgba(13, 148, 136, 0.12);
    margin-left: 8%;
    margin-right: 0;
  }

  @media (max-width: 720px) {
    .qa--q, .qa--a { margin-left: 0; margin-right: 0; }
    .qa-body { padding: 1.05rem 1.15rem; font-size: 1rem; }
    .qa-intro { font-size: 1.12rem; }
  }
</style>

An interview between an AI, playing interviewer, ChatGPT, and Anirudh Gupta, a fourth-year B.Tech undergraduate in Mathematics and Computing at IISc, on what "having a career" really means once every assumption inside that sentence gets questioned. Not just advice, but a philosophical exploration of breadth vs. depth, inherited dreams, understanding yourself before chasing a career, and what's still worth mastering in an age where AI can do the rest.

<div class="qa-thread">

<div class="qa qa--q">
<div class="qa-card">
<div class="qa-head">AI<span class="qa-tag">Interviewer</span></div>
<div class="qa-body" markdown="1">

Let's start right at the beginning of your journey at IISc. When you first walked into IISc as a fresher, what did "having a career" actually mean to you back then? And looking back now, how much of that has quietly shifted on you?

</div>
</div>
</div>

<div class="qa qa--a">
<div class="qa-card">
<div class="qa-head">Anirudh<span class="qa-tag">IISc Undergraduate</span></div>
<div class="qa-body" markdown="1">

When I first joined IISc, coming from a JEE background, a career simply meant:

> **Doing what you love exceptionally well, defined by a success metric which you believe is right for you.**

We've seen all sorts of movies, life-motivation videos, heard of experiences, etc., telling us to do what we love, the best example being *3 Idiots*. As mentioned, a career is also defined by an important metric called **success**, which could be money, fame, number of research papers published, successful products developed, and so on. The common thing was being *exceptional*. That's why I joined IISc, the best research institute in India, to pursue my dream career in research. Why not, right!

Then I hit a wall at the end of my 2nd year, about what I truly loved and wanted to do. I'll highlight it in a funny, mathematical way:

> **<span class="you-think">(YOU THINK)</span> Doing what <span class="you-think">(YOU THINK)</span> you love <span class="you-think">(YOU THINK)</span> exceptionally well <span class="you-think">(YOU THINK)</span> defined by a success metric which <span class="you-think">(YOU THINK)</span> you believe is right for <span class="you-think">(YOU THINK)</span> you.**

Each part of this statement is a spot where I ended up hitting a wall, asking myself a philosophical question about it.

Before going into the details: yes, definitely, these meanings have changed over time, and will probably keep changing as you mould with life. Some may vary, some may not. Asking the `why` behind each is the most important thing.

</div>
</div>
</div>

<div class="qa qa--q">
<div class="qa-card">
<div class="qa-head">AI<span class="qa-tag">Interviewer</span></div>
<div class="qa-body" markdown="1">

You said you hit a wall by the end of second year. I'm curious what that actually felt like, was there a single moment, or maybe a conversation, where something just cracked open for you?

</div>
</div>
</div>

<div class="qa qa--a">
<div class="qa-card">
<div class="qa-head">Anirudh<span class="qa-tag">IISc Undergraduate</span></div>
<div class="qa-body" markdown="1">

Yes, you're right. I landed up staring at my screen, with all sorts of possible course choices within the broad fields I was interested in, each with direct, possible impacts on my career. It could be Lean formalization, systems security, architecture, computational biology, AI/ML, maths, and so on, and you know what, I didn't even know about a lot more things! Quantum computing, cryptography, compiler theory, high-performance computing, and what not.

I realized that while I can't master them all, I should certainly know a little about all of them. Why? Because the future will now involve me knowing about diverse fields. The ability to know a bit of everything and bring it together, fusing it into a tool, is what gives you power and unlocks future potential.

That said, I recall talking to a Microsoft Research person who lived in my society back home. He said:

> **In undergrad, expand your breadth as much as you can. Go for a breadth-first search, you should know about everything. In your Master's and PhD you'll get the chance to master that one particular field.**

That's true. If you start specializing in one field right from undergrad, you become shortsighted, maybe bored, possibly even scared of touching other fields and integrating them into your work.

This affected my decision-making, and I came up with 3 questions for myself when choosing courses and thinking about my career:

1. What do I **NOT** know about at all, enough to even judge whether I like it or not?
2. Among the set of things I've studied, what do I definitely **NOT** want to do, and **WHY**?
3. What do I know I can do, and have possibly shortlisted as **WHAT** to do?

Based on this, it tells you about your likes and dislikes. You don't end up judging a field you don't know about (of course you can't work through the whole list, but to a reasonably good extent you can), and you keep your personal interests aligned. This brought me to a trade-off between early specialization and breadth-first search. Both have their own pros and cons, and I believe it's up to you what to choose.

> **It's YOU who chooses, not the tailwind of the industry.**

</div>
</div>
</div>

<div class="qa qa--q">
<div class="qa-card">
<div class="qa-head">AI<span class="qa-tag">Interviewer</span></div>
<div class="qa-body" markdown="1">

Breadth-first search as a career strategy, I like that framing a lot more than the usual "follow your passion" advice. Let's put that same instinct to work on your own sentence. Time to take it apart together, slowly, one "<span class="you-think">YOU THINK</span>" at a time.

> **<span class="you-think">(YOU THINK)</span> doing what <span class="you-think">(YOU THINK)</span> you love...**

In the beginning you mention about *doing*. What does *doing* really mean to you?

</div>
</div>
</div>

<div class="qa qa--a">
<div class="qa-card">
<div class="qa-head">Anirudh<span class="qa-tag">IISc Undergraduate</span></div>
<div class="qa-body" markdown="1">

The **"<span class="you-think">YOU THINK</span>"**s are the spots where you end up questioning some part of your life, as I said before. Each has its own meaning, some are deeper, philosophically; some are just about how hardworking you are.

The first **"<span class="you-think">YOU THINK</span>"** is about *doing*. This is mainly about choosing to do something: how much effort you put into it, and how driven you are around it. It's the first <span class="you-think">YOU THINK</span> because, without a purpose, and without the drive to execute your dreams, what's the use? Give everything you've got in everything you do. The passion for *doing* is needed before you choose to do anything. If you think you'll *do* well only once you get to do what you love, that's just fake, that's delusional. God might not give you the opportunity to do what you love if he sees you screwing around with the opportunities you already have.

---

Now comes another, deeper question: what exactly do you even do? This one and the previous are well intertwined. We grow up in an environment where a career path is handed to us, and we're usually asked to follow it for a safe and secure life. Nothing bad about it, a lot of people do that; some like it, some don't. I feel such roads should exist, because not everyone has the capability to do extraordinary things. We're all average. Every great man was once an average man; only after *doing* did he become exceptional. There's nothing wrong in being average either, it's the stigma created today by social media, that unless you do something with a media "wow" factor, it's all useless. Which I feel is dog-water. You end up losing the happiness of everyday problem-solving.

Coming back from that tangent: you can choose to do what you love, sports, media, business, academics, tech, fashion, chef, butler, gardener, vet, and so on. Nothing wrong with any one of them. Sure, one pays more and the other less.

> **Are you doing what you love, or what you were told to love?**

But there's a catch. Sometimes you're conditionally incapable of doing what you love, you don't have enough time or money for it, among other reasons. But nobody stops you from putting in those extra 2 hours at the end of the day, doing what you love and developing the skill for it. Why suffocate yourself if you aren't able to do it right now?

Self improvement and growth is a continuous process. You become good from average by putting in the effort. But do not let it drive you crazy either. That's where another <span class="you-think">YOU THINK</span> comes in, the exceptionally well part. You start from nothing or average, and you keep improving. You have to be patient and consistent. Do it at your pace. You will get there. You might think since the world shows you the "exceptional" people, you need to be like them instantly. But the truth is, ask anyone of them, and they will tell you that they started from nothing. They were average too. Work at your pace, your own way, and don't fall for the hype of the world.

---

You asked how careers evolve. Yes, they change, one time you want to be a pilot, then a businessman, then a scientist or engineer, and then you end up as a salesperson. Now this may take two tracks: you ended up liking what you do, or hating it. For the latter, well, it happens. Put in those extra hours of changing yourself toward what you love, and who knows what paths open up.

</div>
</div>
</div>

<div class="qa qa--q">
<div class="qa-card">
<div class="qa-head">AI<span class="qa-tag">Interviewer</span></div>
<div class="qa-body" markdown="1">

Here's what I'm actually curious about: has there been a moment where you caught yourself chasing someone else's definition of "loving it" or "doing it well", and realized halfway through that it wasn't really yours? How did you course-correct, if at all? Would you still consider that success, if otherwise?

</div>
</div>
</div>

<div class="qa qa--a">
<div class="qa-card">
<div class="qa-head">Anirudh<span class="qa-tag">IISc Undergraduate</span></div>
<div class="qa-body" markdown="1">

I feel that's the beginning of everything. When you start chasing your dream, you later end up realizing that it was someone else's dream, like becoming a doctor or an engineer. You need to realize that the dream you are chasing is **yours too**, there's no shame in realizing you actually *like* someone else's dream, but then it has to become part of **your** life, not anybody else's. The sooner you work out whether you **align or don't align** with it, the better. How to do that? A line I heard from a motivational speaker: *"Give everything you've got in everything you do. If you end up going the wrong way, you will find out quicker."* If you are chasing your dream, you'll be satisfied doing it. Every journey is hard, no doubt. But you will know when you are doing the right thing for you, and yes, that's the drive to do again, just showing up in a new place.

Which brings me to *love*, since I think that's what actually separates chasing a dream from just liking it. Liking something is enjoying it when it's easy. Love is choosing it on the days it isn't, when the result doesn't come, the work is boring, and you're still there the next morning anyway. For me, my mother gave me the freedom to choose my own career path but wisely guided me toward the right one; I kept changing my mind between my own interests and her guidance, and I appreciated it, since to some extent I do align with her thinking. That process of coming back to something, again and again, even after changing my mind about it, that's usually how I know it's love and not just a phase.

As for doing it *exceptionally well*, I touched on this earlier: it's not about being instantly exceptional, it's about starting average and consistently getting better at your own pace. What I'd add here is that "well" isn't a fixed bar either, it's just whatever version of good you haven't reached yet. The moment you think you've done something exceptionally well, that's usually the moment to ask what the next "well" looks like.

Now, the success metric. How do you define success? Is it money, fame, or just the satisfaction of doing what you love? The answer is different for everyone. Continuing from the previous point, the world's metric of success is commonly money and fame, which is also a good metric, since it's a tangible one. But the satisfaction of doing what you love is another choice. Farmers, authors, artists, and many others are not rich or famous, but are satisfied with their work and happy. They can consider working in their field, having a family, and living a healthy life as success. The point is, you are the one who defines your own success metric. You have to ask yourself these questions.

From my personal experience, in my earlier years, I used to think that money, at least, is a success metric, since you can live a mostly happy and comfortable life. Now, I've started considering different success metrics. They've zoomed out from everyday life to broader perspectives. For example, good understanding and application of knowledge as a success metric. I've always been interested in research and development, and whenever I'm able to use the knowledge I've gained from a course I got a B in, I feel great. This shift in success metric reveals the true <span class="you-think">YOU THINK</span> meaning. Solving problems brings happiness to me, my own, and many times others' problems too. Yet at the same time, I do align with the money metric. For people in research, finding this balance is important, since their lives are mostly spent in a hard, slow, and less monetarily rewarding field.

TL;DR, defining your own success metric is important. It should be a balance between your personal interests and the world's metric of success. It should range from zoomed in everyday life to zoomed out bird's eye view. The metric keeps on changing, as it should too. Yet, you should base them on your personal values and goals.

</div>
</div>
</div>

<div class="qa qa--q">
<div class="qa-card">
<div class="qa-head">AI<span class="qa-tag">Interviewer</span></div>
<div class="qa-body" markdown="1">

What do you mean by the other <span class="you-think">YOU THINK</span>'s in your sentence? If not for you then whom?

</div>
</div>
</div>

<div class="qa qa--a">
<div class="qa-card">
<div class="qa-head">Anirudh<span class="qa-tag">IISc Undergraduate</span></div>
<div class="qa-body" markdown="1">

This question hits me personally. For me, the answer has thankfully never changed. It's for your close ones, your family, and yourself. They've put in hard work, love, and money into everything you are right now. Yet a lot of people don't value that. They don't value the sacrifices their parents made, and end up throwing it all away chasing things that feel good in the moment but don't actually add up to anything.

This might not be very relatable to a lot of readers, but the people you work for are the best driving source to work on your career and support them. This might sound old, things dads or grandparents say, but it's true. You are the one who is responsible for your family and yourself. How could you think of forgetting them? How does it not drive you to see them still working hard for you at their age, yet you still lie around doing nothing? It's a mentality shift more than anything, if you don't do it for yourself, at least look out for people who are there for you. This is very entangled with your career.

</div>
</div>
</div>

<div class="qa qa--q">
<div class="qa-card">
<div class="qa-head">AI<span class="qa-tag">Interviewer</span></div>
<div class="qa-body" markdown="1">

Family, sacrifice, responsibility, I hear you on all of that. But I want to push back a little, because reading this whole conversation back, it's starting to sound like the only thing that matters is putting your head down and grinding. Where do fun, friends, and just enjoying the ride actually fit into how you think about a career?

</div>
</div>
</div>

<div class="qa qa--a">
<div class="qa-card">
<div class="qa-head">Anirudh<span class="qa-tag">IISc Undergraduate</span></div>
<div class="qa-body" markdown="1">

Good catch, and honestly I don't want it to sound that way either. Family and hard work are the *why*, they're not the whole picture. Fun, friends, downtime, they aren't distractions from a career, they're what keep you sane enough to actually build one. Some of my best ideas, and even some of my best decisions, have come out of a random 1 AM conversation with a friend, not a study session.

Enjoyment recharges you. Without it, the drive to do that I talked about earlier just burns out, you can't keep giving 100% on an empty tank. So no, this was never about becoming some joyless machine chasing a metric. It's about doing meaningful work, and making sure there are people and moments around it that make the whole thing worth doing in the first place.

</div>
</div>
</div>

<div class="qa qa--q">
<div class="qa-card">
<div class="qa-head">AI<span class="qa-tag">Interviewer</span></div>
<div class="qa-body" markdown="1">

If a first-year at IISc sat across from you right now, completely lost about what to do with their next four years, what's the one thing you'd actually tell them to *do*, something practical they could start this week?

</div>
</div>
</div>

<div class="qa qa--a">
<div class="qa-card">
<div class="qa-head">Anirudh<span class="qa-tag">IISc Undergraduate</span></div>
<div class="qa-body" markdown="1">

As a first year, give your 100% in everything you do, don't worry about the future, that'll take care of itself. Focus on your present. If you want something practical to actually start this week: pick one thing completely outside your comfort zone, a club, a random elective, a conversation with a senior in a field you know nothing about, and give it a real shot for a month before deciding you don't like it. That's breadth-first search in practice, not just theory.

Beyond that, make yourself genuinely good at whatever you're learning, that comes from conceptual understanding and thoroughness, and it's what will set you apart from everyone else. Personally, I focused on practical skills over theory, so my application, code, and problem-solving are stronger than my theoretical knowledge, and, admittedly, my grades. Choose what you want to do, then commit to it fully. Find your passion. If you can't find it yet, find something you like, the rest can follow.

</div>
</div>
</div>

<div class="qa qa--q">
<div class="qa-card">
<div class="qa-head">AI<span class="qa-tag">Interviewer</span></div>
<div class="qa-body" markdown="1">

Here's one I have a personal stake in: we're talking about careers at a moment when tools like me(AI) are getting good enough to write the code, draft the paper, even do the "thinking" people used to build careers around. Does that change how you'd answer any of this? What do you think is actually worth getting exceptionally good at in an age where a lot of "doing it well" can be outsourced to an AI?

</div>
</div>
</div>

<div class="qa qa--a">
<div class="qa-card">
<div class="qa-head">Anirudh<span class="qa-tag">IISc Undergraduate</span></div>
<div class="qa-body" markdown="1">

There is no right answer to this, honestly. **Use AI as a tool, not a replacement for your brain.** The more you use it to enhance yourself rather than take shortcuts, the better it is. Going slow in life is the way to be successful, the more you do it yourself, the better you will be at it. AI is a tool to enhance your work; you'll only feel hollow from the inside the more you lean on it. Then why use so much of it, if it completes your work and you understand nothing from it? Let other people hype and drown themselves in AI. You will be the one who's better than them in the long run. It's about feeling good about yourself, not about what others' opinion of how fast you are is. That said, AI can really cut down a lot of grunt work, testing, slides, animations, and so on. But use it wisely.

</div>
</div>
</div>

<div class="qa qa--q">
<div class="qa-card">
<div class="qa-head">AI<span class="qa-tag">Interviewer</span></div>
<div class="qa-body" markdown="1">

Quick, fun one before we close: if your course choices/career so far were a course at IISc, what would you title it, and what grade would you honestly give yourself?

</div>
</div>
</div>

<div class="qa qa--a">
<div class="qa-card">
<div class="qa-head">Anirudh<span class="qa-tag">IISc Undergraduate</span></div>
<div class="qa-body" markdown="1">

Very interesting question, I would probably name it **"A Multidimensional Approach to Approximating JOATMON,"** where JOATMON means "Jack of All Trades, Master None," and give myself an **A** grade.

Why? I don't think I'm master of anything right now, I'm still a kid in the ocean. Though I've learnt a lot about many fields, mathematics, computer science, physics, biology, communication, life, friends, and so on. In the coming world where AI is the true jack of all trades, I feel just knowing one thing could be a disadvantage, since you'll be left behind unless you're *really* good at that one thing. I personally don't think I'm someone who can be really good at one thing, but I can be good at many things. I've asked myself many *why*'s in life, and this is the road I'm taking.

I still won't give myself an A+, since I feel I can do better in those areas too. Maybe putting myself into too many things sometimes doesn't let me focus on one and do it really well either. So I feel I can do better at an A. I didn't give myself a B+, since that would make me feel like I'm not doing enough, and maybe self-doubt would creep in.

</div>
</div>
</div>

<div class="qa qa--q">
<div class="qa-card">
<div class="qa-head">AI<span class="qa-tag">Interviewer</span></div>
<div class="qa-body" markdown="1">

Last one, and I'll keep it short, if you had to rewrite your original definition of a career today, in a single sentence, what would it say?

</div>
</div>
</div>

<div class="qa qa--a">
<div class="qa-card">
<div class="qa-head">Anirudh<span class="qa-tag">IISc Undergraduate</span></div>
<div class="qa-body" markdown="1">


> **Doing <span class="you-think">THE BEST</span> in what you love <span class="you-think">WHICH ALIGNS WITH YOUR VALUES AND INTERESTS</span> well <span class="you-think">AT YOUR PACE</span> defined by a success metric <span class="you-think">WHICH KEEPS YOUR EVERYDAY LIFE HAPPY, SATISFIED and GOAL-DRIVEN</span> which you believe <span class="you-think">BASED ON YOUR LIFE PRIORITIES</span> is right for <span class="you-think">PEOPLE YOU CARE FOR, including YOU</span>.**

</div>
</div>
</div>

</div>