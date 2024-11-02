<script>
  import Router from "svelte-spa-router";
  import { routes } from "./lib/router";
  import { push, replace } from "svelte-spa-router";

  const path = window.location.pathname;
  if (path == "/") {
    replace("/");
  }
</script>

<div>
  <div id="background-container">
    <div id="background"></div>
  </div>

  <div class="layout-content">
    <div class="layout-dock">
      <ol class="dock wide-screen-dock">
        <li>
          <div class="tooltip">About Me</div>
          <!-- svelte-ignore a11y_missing_attribute -->
          <!-- svelte-ignore a11y_consider_explicit_label -->
          <a href="/#/" class="dock-button button"
            ><img src="/img/odbc.png" class="dock-icon" /></a
          >
        </li>
        <li>
          <div class="tooltip">Blog</div>
          <!-- svelte-ignore a11y_missing_attribute -->
          <!-- svelte-ignore a11y_consider_explicit_label -->
          <a href="/#/blog" class="dock-button button"
            ><img src="/img/html2.png" class="dock-icon" /></a
          >
        </li>
        <li>
          <div class="tooltip">Games</div>
          <!-- svelte-ignore a11y_missing_attribute -->
          <!-- svelte-ignore a11y_consider_explicit_label -->
          <a href="/#/games" class="dock-button button"
            ><img src="/img/games.png" class="dock-icon" /></a
          >
        </li>
        <li>
          <div class="tooltip">Work</div>
          <!-- svelte-ignore a11y_missing_attribute -->
          <!-- svelte-ignore a11y_consider_explicit_label -->
          <a href="/#/work" class="dock-button button"
            ><img src="/img/work.png" class="dock-icon" /></a
          >
        </li>
        <li>
          <div class="tooltip">Git Activity</div>
          <!-- svelte-ignore a11y_missing_attribute -->
          <!-- svelte-ignore a11y_consider_explicit_label -->
          <a href="/#/git" class="dock-button button"
            ><img src="/img/git.png" class="dock-icon" /></a
          >
        </li>
      </ol>
    </div>
    <div id="content-window">
      <div class="window">
        <div class="title-bar">
          <!-- Get the current route and display it in the title bar -->
          <div class="title-bar-text">OOGA BOOGAWARE</div>
        </div>
        <div class="window-body" style="overflow: auto;">
          <Router {routes} />
        </div>
        <div class="status-bar">
          <p class="status-bar-field">Hire me</p>
          <p class="status-bar-field">Slide 1</p>
          <p class="status-bar-field">CPU Usage: 14%</p>
        </div>
      </div>
    </div>
  </div>
</div>
