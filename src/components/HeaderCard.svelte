<script>
  export let title = "";
  export let description = "";
</script>

<div class="entry-header">
  <h1>{title}</h1>
  <p>
    {@html description}
  </p>
</div>

<hr class="divider" />

<style>
  .entry-header h1 {
    font-size: 2em;
    font-family: verdana;
    margin: 0px !important;
    padding: 10px;
  }
  .entry-header p {
    margin: 0px !important;
    padding: 10px;
  }
</style>
