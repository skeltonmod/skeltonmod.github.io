<script>
  export let title = "";
  export let description = "";
  export let image = "";
  export let link = "";
  export let link_title = "";
  export let metadata = [{
    name: "",
    value: "",
  }];
</script>

<div class="entry">
  <img src={image} alt="Destroy The Porn HTML5 Remake" />
  <h2>{title}</h2>
  {#each metadata as meta}
    <p><strong>{meta.name}:</strong> {meta.value}</p>    
  {/each}
  <p>
    {@html description}
  </p>
  {#if link != ""}
    <a href={link}>{link_title}</a>
  {/if}
</div>

<hr class="divider" />

<style>
  .divider {
    width: 100%;
  }
  .entry {
    margin-bottom: 20px;
    padding: 10px;
  }
  .entry img {
    width: 30%;
    height: auto;
    border: 1px solid #000;
  }
  .entry h2 {
    font-size: 1.5em;
    margin: 10px 0;
  }
  .entry p {
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
