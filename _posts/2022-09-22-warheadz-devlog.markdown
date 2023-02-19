---
title: Warheadz Devlog
date: 2022-09-22 16:08:00 Z
categories:
- dev
---

**THIS PROJECT IS ABANDONED**

**Day 0**
I didn't know brainstorming original ideas are hard, took me 4 hours to get a good and marketable idea. thanks to the theme being a bit free and lax, I can experiment on previous ideas implemented by other games.

I have decided to copy the core idea of sneak ops but with a twist, you cannot stay idle for a very specific amount of time.
This in effect will make the game inline to the theme of "Keep Moving" . The movement for the game will be a one thumb experience.

This will include the moving, shooting and interacting of the game.

The real challenge here is that I will be in the office next week. I will need to discipline myself this time if I want to get that $10,000 cash price, or win in general.

See you on the next update!

**Day 1**
Movement and Collisions are done, thanks to my older game prototypes that already have those in place. It was a breeze to make and relatively quick.

![image.png](/uploads/image.png)

So far so good.\
I will now add a simple enemy AI, a shooting mechanic and the core gameplay on Day 2 (procrastination is a bitch)The planned core gameplay is that, there will be a timer somewhere in the game that would keep track of the playerwhen he's not moving, It will alert all the enemies in a certain radius to go the player.

\
Adieu, see you in the next update!

\
**Day 2**

Finally Got the AI to work correctly, but the code is a mess, might need to refactor this shit once I get the other parts done.I also got the shooting mechanics and the core gameplay set, now it's just a matter of implementing the theme of the game,which is the \*\*\*"Keep Moving" \*\*\*motif. \
The AI was time consuming to implement, thankfully there are a couple of implementations from previous source codes that I have gathered through all the years of my learnings in Game Maker Studio

![GIF 06-10-2022 9-23-24 pm.gif](/uploads/GIF%2006-10-2022%209-23-24%20pm.gif)

From this fucking jank to this

![GIF 06-10-2022 10-29-50 pm (1).gif](/uploads/GIF%2006-10-2022%2010-29-50%20pm%20(1).gif)

Now the AI feels a lot more natural.\
I have also implemented some shooting mechanics as well

![GIF 06-10-2022 11-38-23 pm.gif](/uploads/GIF%2006-10-2022%2011-38-23%20pm.gif)

I must say, the placeholder looks gorgeous even for placeholder standards.

\
So far so good. It feels very satisfying to see the progress from Day 0 to Day 2. Maybe, just maybe I'll look at this in the future and feel proud of myself for this endeavor, Whether if I win or not the experience this gave me is nothing like I have ever experience before.

\
I might have to setup VCS for the project this friday.\
Now the next problem will be level design and the art for the game, both of which are way beyond my skillset. I guess I'll have to bite the bullet this time and crack my fingers again.Or maybe I can barrow some sprites from other games, we'll see.

\
Thank you for reading self, now unto the next update. See you tommorrow!

\
**Day 3 and 4**

Not much happened during the third day, but there was a huge revamp in how the AI works in Day 4 but unfortunately, the internet fucking died (thanks a lot pldt, you bitch!)Updates will resume on Day 5, this will include the graphics, some levels to make way for the story, new enemy types for added variety and a user interface.\
The fucking ISP bitched out and I have to move the levels and graphics on the 5th day, thanks a lot pldt!\
See you tomorrow with some real updates.

\
**Day 5**

So, something came up while I was having a smoke break, an epiphany if you in a sense.

I figured making this a story oriented game with stealth mechanicslooks, feels and sounds a bit boring. The gameplay is now changed from a stealth game, to a roguelike room jumper, the added mechanic this time will bethe current section you're in is timed, encouraging you to keep moving.

\
Since the game already has a function chase AI, I figured I might as well turn them into a melee type enemy. Thankfully, I'm still not that far off progress wise.

![GIF 10-10-2022 11-06-32 pm.gif](/uploads/GIF%2010-10-2022%2011-06-32%20pm.gif)

Well, it's a good thing I thought of this now.\
\*So, what's the new mechanic like? \*

The game would throw you to a section of the room, and the game will start counting down to a specific timer and once the timer is reach, it willthrow you into a new section of the room all while discarding your current items. it will then give you a new set of weapon.

\
All right, let's get to it then. Todo list is now updated to remove the old mechanic, quite surprised it remove the skill overhead needed to finish the game.\
See you in a bit!

**Day 6**

Office is starting to tire me physically. I might just crunch the rest of the features on Friday, but if I can find the time and energy to do these within, then I'll take that chance!

![GIF 11-10-2022 9-33-54 pm.gif](/uploads/GIF%2011-10-2022%209-33-54%20pm.gif)

Added some sprites, because the game is now renamed into Warheads (it's a crappy joke) Progress is good at the moment, some minor slowdowns due to work but I'll do everything in my power to finish this before the deadline.\
Not much to show today aside from the added graphics.\
I also tried exporting the game on GX and I'm surprised about the performance but I have to remove the window scaler since the GX exporter has some problems with the rendering.\
I might have to reverse wasteland kings or use RGBA to map for the level generation, I'll probably split both if I have the time, wasteland kings generator for endless mode and RGBA for themain game.\
Until Then. Ciao!

**Day 7 and 8**

![GIF 14-10-2022 10-47-47 pm.gif](/uploads/GIF%2014-10-2022%2010-47-47%20pm.gif)

Well, it looks promising now, random map generation took me about 3 days to finish. that and on top of my work schedule.

\
But, I'm happy of the result just copied the code from nuclear throne.

\
A few problems with the nuclear throne source code is that it's messy and hard to read, mp_grids also doesn't work with randomly placed objects.

\
It took me 2 days to figure out that mp_grid cells aren't 1:1 with the room, and I have to convert it to cell coordinates inorder for it to work luckily there is an existing implementation lying around.

\
So far so good with where things are going, now I just have to figure out how to properly satisfy the jam theme. I'll probably figure it out tomorrow.

\
That's probably all for now, see you in a bit!