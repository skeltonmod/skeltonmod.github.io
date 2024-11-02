<script>
  import { push } from "svelte-spa-router";
</script>

<div class="game-container">
  <div class="game-header">
    <h1>Professional Projects</h1>
    <p>
      For portfolio sake, these are some of my most notable Professional
      projects I've worked on.
    </p>
  </div>

  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/spek.png" alt="Destroy The Porn HTML5 Remake" />
    <h2>Spek</h2>
    <p><strong>Role:</strong> Fullstack</p>
    <p><strong>Project Lifecycle:</strong> 2020 to 2024</p>
    <p>
      One of the longest project that I have worked on, Spek is a web
      application that helps real estate professionals create and manage their
      real estate properties
    </p>
  </div>

  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/gg.png" alt="Destroy The Porn HTML5 Remake" />
    <h2>Give N Get</h2>
    <p><strong>Role:</strong> Fullstack</p>
    <p><strong>Project Lifecycle:</strong> 2021 to 2023</p>
    <p>
      A non profit challenge app for donating to charity. I did the porting of
      their old codebase to our internal tech stack at work.
    </p>
  </div>

  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/cgps.png" alt="Destroy The Porn HTML5 Remake" />
    <h2>Change GPS V2</h2>
    <p><strong>Role:</strong> Front end</p>
    <p><strong>Project Lifecycle:</strong> 2024</p>
    <p>
      An accounting web app that has a lot of modues, mainly working on their
      blueprint and letters merge module.
    </p>
  </div>

  <hr class="divider" />

  <div class="game-header">
    <h1>Personal Projects</h1>
    <p>
      A not so exhaustive list of my personal projects. some of them are
      comissions from various clients while some of them are just for fun or to
      satiate my curiosity.
    </p>
  </div>
  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/wash.png" alt="Destroy The Porn HTML5 Remake" />
    <h2>The Wash</h2>
    <p><strong>Role:</strong> All around</p>
    <p><strong>Project Lifecycle:</strong> 2019 to Present</p>
    <p>
      Started way back as a basis for this very site, it's now used to scrape
      Anime from sites that are littered with Ads. This site was also the start
      of my blogging era.
    </p>
  </div>

  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/coolaborate.png" alt="Destroy The Porn HTML5 Remake" />
    <h2>Coolaborate</h2>
    <p><strong>Role:</strong> All around</p>
    <p><strong>Project Lifecycle:</strong> 2022 to early 2023</p>
    <p>
      A udemy clone commissioned to me by TechYes, a course sharing platform for
      local teachers.
    </p>
  </div>

  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/rankboss.png" alt="Destroy The Porn HTML5 Remake" />
    <h2>Rankboss</h2>
    <p><strong>Role:</strong> All around</p>
    <p><strong>Project Lifecycle:</strong> 2023 to 2024</p>
    <p>
      An SEO optimzation and optimzation platform, I was comissioned by my
      colleagues for this project. This may or may not be the source of my
      distrust towards my said colleagues.
    </p>
  </div>

  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/coffee.png" alt="Destroy The Porn HTML5 Remake" />
    <h2>CNN Coffee Image Classification</h2>
    <p><strong>Role:</strong> Researcher</p>
    <p><strong>Project Lifecycle:</strong> 2023</p>
    <p>
      A small experiment with CNN Resnet for image classification base on
      various stages of coffee beans. This was comissioned to me by Nescafe
      researchers.
    </p>
  </div>

  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/roadside.png" alt="Destroy The Porn HTML5 Remake" />
    <h2>Roadside Assistance Web Admin dashboard</h2>
    <p><strong>Role:</strong> Front end</p>
    <p><strong>Project Lifecycle:</strong> 2024</p>
    <p>
      A companion web application for Roadside Assistance, this dashboard is for
      managing and analyzing data.
    </p>
  </div>

  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/mp.png" alt="Destroy The Porn HTML5 Remake" />
    <h2>MiniPlayer</h2>
    <p><strong>Role:</strong> Researcher</p>
    <p><strong>Project Lifecycle:</strong> 2024</p>
    <p>
      A short lived experiment I did to make a spotify clone, had to ditch the project because IOS doesn't like
      to support m4a.
    </p>
  </div>
  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/mm.png" alt="Destroy The Porn HTML5 Remake" />
    <h2>Mini Messenger</h2>
    <p><strong>Role:</strong> Fullstack</p>
    <p><strong>Project Lifecycle:</strong> 2024</p>
    <p>
      Back when facebook still has messenger support for it's mbasic domain, this was more of an experiment to 
      see if I can make my own messenger UI using teutonic css.
    </p>
  </div>

  <hr class="divider" />

  <div class="game-header">
    <p>
     <strong>
      While the concept of putting effort in my portfolio site is new to me, there are still other projects I've worked on
      that I may not have listed here due to the fact that most of them are still in source form, I might add them in the future
      if I ever find the time to compile them and provide atleast a decent screenshot.
     </strong>
    </p>
  </div>
</div>

<style>
  .game-container {
    background-color: #fff;
    border: 1px solid #000;
    max-height: 800px;
    overflow-y: auto;
  }
  .game-header h1 {
    font-size: 2em;
    font-family: verdana;
    margin: 0px !important;
    padding: 10px;
  }
  .game-header p {
    margin: 0px !important;
    padding: 10px;
  }
  .divider {
    width: 100%;
  }
  .game-entry {
    margin-bottom: 20px;
    padding: 10px;
  }
  .game-entry img {
    width: 30%;
    height: auto;
    border: 1px solid #000;
  }
  .game-entry h2 {
    font-size: 1.5em;
    margin: 10px 0;
  }
  .game-entry p {
    margin: 5px 0;
  }

  h2 {
    font-size: 1.5em;
    font-family: verdana;
  }

  hr {
    margin: 0px !important;
  }
</style>
