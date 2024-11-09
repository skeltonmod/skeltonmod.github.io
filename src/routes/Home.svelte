<script>
  import { onMount } from "svelte";
  import { fetchEvents } from "../methods/git";

  let current_date = new Date().toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  onMount(async () => {
    const data = await fetchEvents();

    const recentPortfolioEvent = data.filter((item) => {
      return item.repo.id == 410241753;
    });

    if (recentPortfolioEvent) {
      current_date = new Date(
        recentPortfolioEvent[0].created_at
      ).toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
    }
  });
</script>

<h4 class="home-header" style="font-size: 2rem !important">
  <strong>Skeltonmod</strong>
</h4>
<div class="avatar-container">
  <img
    src="/avatar.gif"
    class="avatar"
    alt="Cool skeleton gif from the 80s or something"
  />
  <p>Hi, I'm Elijah. It's nice to meet yuh.</p>
  <p>
    <strong>Unorthodox developer with a lot of free time</strong>
  </p>
  <p>You can also find my work related stuff here</p>
  <p>Site was last updated at <strong>{current_date}</strong></p>
</div>
