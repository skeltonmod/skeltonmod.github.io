<script>
  import { push } from "svelte-spa-router";
</script>

<div class="game-container">
  <div class="game-header">
    <h1>Completed and Finished (Probably) Games</h1>
    <p>
      This the the list all of my games that are considered completed and
      finished. Do note that while the games are finished, they can either be
      unpolished or have bugs that I've decided not to fix because I'm lazy.
    </p>
    
  </div>

  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/branncom.png" alt="Destroy The Porn HTML5 Remake" />
    <h2>BrannCom</h2>
    <p><strong>Platform:</strong> HTML5, 2024</p>
    <p>
      A parody of PanCom, this game was made as a love letter for my Girlfriend
      for out 2nd month celebration. This parody does feature a VHS filter
      effect to make it more fun to watch.
    </p>
    <a href="/#/games/branncom">Play here</a>
  </div>

  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/dtp.png" alt="Destroy The Porn HTML5 Remake" />
    <h2>Destroy The Porn HTML5 Remake</h2>
    <p><strong>Platform:</strong> HTML5, 2024</p>
    <p>
      The first game I made in 2024. It's a remake of Destroy The Porn, a game
      that was made in 2013. It was mostly an excuse to learn how to make a game
      in HTML5 for the first time in a while. I did the programming. design and
      graphics were done by the original DrunkDevs.
    </p>
    <a href="/#/games/dtp">Play here</a>
  </div>

  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/apis.png" alt="Bob Came In Pieces" />
    <h2>Appraise in Space</h2>
    <p><strong>Platform:</strong> HTML5, 2016</p>
    <p>
      Created this game back in 2016. It's a badly made clone of another game,
      this was before I knew anything about game development. I did the
      programming, design and graphics. This game was made as a joke for my
      friends who liked M LP and Undertale.
    </p>
    <a href="/#/games/apis">Play here</a>
  </div>

  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/shootyman.png" alt="Shootyman 2k20" />
    <h2>Shootyman 2k20</h2>
    <p><strong>Platform:</strong> HTML5, 2020</p>
    <p>
      A game made in 2020. It's a simple game where you shoot aliens. It started
      out as my curiosity for godot and my attempt to learn how to make a game
      in it. This game was also made during the pandemic because, I got bored
      during the lockdown.
    </p>
    <a href="/#/games/shootyman">Play here</a>
  </div>

  <hr class="divider" />

  <div class="game-header">
    <h1>Experiments</h1>
    <p>
      These are the games that are not finished but offer some insights to my
      game development learning.
    </p>
  </div>

  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/scb.png" alt="Shootyman 2k20" />
    <h2>Super Crate Clone</h2>
    <p><strong>Platform:</strong> HTML5, 2023</p>
    <p>
      A game I made back in 2023, It's more of a prototype for my online
      highscore API, this experiment was culmination of my combined experience
      with Software Engineering and Game Development. This game is an obvious
      rip off of <strong>Super Create Box</strong>
    </p>
    <a href="/#/games/scb">Play here</a>
  </div>

  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/pitch.png" alt="Shootyman 2k20" />
    <h2>Princess Pitch HTML5</h2>
    <p><strong>Platform:</strong> HTML5, 2022</p>
    <p>
      Back when I discovered that you can actually make more accessible games by
      publishing them on the web, this was a recreation of Dan Remar's Hyper
      Princess Pitch. It never got finished because of my conflicting schedules
      at that time.
    </p>
    <a href="/#/games/pitch">Play here</a>
  </div>

  <hr class="divider" />
  <div class="game-header">
    <h1>Old Games</h1>
    <p>
      These are the games that were made during my highschool and junior years.
    </p>
  </div>

  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/superm.png" alt="Shootyman 2k20" />
    <h2>MLG Mykel</h2>
    <p><strong>Platform:</strong> Windows, 2015</p>
    <p>
      The very first game that I have made during highschool. It's created in
      Clickteam Fusion 2.5. I guess you could say this kicked off my career.
    </p>
    <a
      href="https://download.gamejolt.net/f3d6405900556e4740c4c837d587755fa81cc7d91ebace6a315c4e0296155142,1730642600,7/data/games/2/248/138998/files/5704aa61376da/MLG-asteroids.exe"
      >Download</a
    >
  </div>

  <hr class="divider" />

  <div class="game-entry">
    <img src="/preview/ass.png" alt="Shootyman 2k20" />
    <h2>Assteroids</h2>
    <p><strong>Platform:</strong> Windows, 2016</p>
    <p>
      This was made in 2016 during my 11th grade. It's a simple game where you have
      to dodge and shoot asteroids. This game helped me learn about game
      development basics. This is also a game where I started to write code.
    </p>

    <a
      href="https://download.gamejolt.net/a823d7045334ef5867513c9591b89074e7f114b05d3046a96bc6f2584761519f,1730642531,7/data/games/3/1/216001/files/5848ec28256ad/Asteroids.zip"
      >Download</a
    >
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
