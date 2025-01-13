<script>
  import { onMount } from "svelte";
  import { fetchEvents } from "../methods/git";

  let events = [];

  onMount(async () => {
    events = await fetchEvents();
  });
</script>

<h4 class="home-header" style="font-size: 1rem !important">Git logs</h4>
<div class="avatar-container">
  <img
    src="/smoke.gif"
    class="avatar"
    alt="Cool skeleton gif from the 80s or something"
  />
  <p>
    Instead of showing you my github profile, why not instead just show you my
    github activities instead
  </p>

  <p>
    But if you really want to look at my github profile, <a
      href="https://github.com/skeltonmod">you can check it out here</a
    >
  </p>
  <div class="feed-container">
    {#if !events.length}
      <p>Loading Content</p>
    {/if}

    {#each events as event}
      <div class="event-card">
        <img
          src={event.actor.avatar_url || ""}
          alt="Profile Picture"
          class="profile-picture"
        />
        <div class="event-details">
          <p class="commit-message">
            {event.payload.commits && event.payload.commits.length > 0
              ? event.payload.commits[0].message
              : "No commit message available"}
          </p>
          <p class="event-repo">{event.repo.name}</p>
          <p class="event-time">
            {new Date(event.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .feed-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    max-width: 390px;
    margin: auto;
    justify-content: flex-start;
    background-color: white;
    border: 1px solid black;
    max-height: 600px;
    overflow-y: auto;
  }

  .event-card {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    font-family: "Courier New", Courier, monospace;
  }

  .profile-picture {
    width: 40px;
    height: 40px;
    margin-right: 0.5rem;
    background-color: #d3d3d3;
  }

  .event-details {
    display: flex;
    flex-direction: column;
    justify-content: start;
  }

  .commit-message {
    color: #0047ab;
    margin: 0;
  }

  .event-repo {
    font-size: 0.85rem;
    color: #404040;
    margin: 0.2rem 0;
  }

  .event-time {
    font-size: 11px;
    color: #606060;
    margin: 0;
  }

  .feed-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    max-width: 390px;
    margin: auto;
    justify-content: flex-start;
    background-color: white;
    border: 1px solid black;
    max-height: 600px;
    overflow-y: auto;
  }

  /* Breakpoint for screens larger than 768px (tablet) */
  @media (min-width: 768px) {
    .feed-container {
      max-height: 100px;
    }
  }

  /* Breakpoint for screens larger than 1024px (desktop) */
  @media (min-width: 1189px) {
    .feed-container {
      max-height: 400px;
    }
  }
  /* Breakpoint for 1080p monitors (1920px and above) */
  @media (min-width: 1920px) {
    .feed-container {
      max-height: 500px; /* Adjust this height as needed */
    }
  }
</style>
