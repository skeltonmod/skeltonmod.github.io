<script>
  import {
    professional_projects,
    personal_projects,
    work_headers,
  } from "../lib/data";
  import EntryCard from "../components/EntryCard.svelte";
  import HeaderCard from "../components/HeaderCard.svelte";
</script>

<div class="entry-container">
  {#each professional_projects as item, index}
    {#if index == 0}
      <HeaderCard
        title={work_headers[0].title}
        description={work_headers[0].description}
      />
    {/if}
    <EntryCard
      title={item.title}
      description={item.description}
      image={item.image}
      metadata={item.metadata}
    />
  {/each}

  {#each personal_projects as item, index}
    {#if index == 0}
      <HeaderCard
        title={work_headers[1].title}
        description={work_headers[1].description}
      />
    {/if}
    <EntryCard
      title={item.title}
      description={item.description}
      image={item.image}
      metadata={item.metadata}
    />
  {/each}

  <HeaderCard description={work_headers[2].description}/>
</div>

<style>
  .entry-container {
    background-color: #fff;
    border: 1px solid #000;
    max-height: 600px;
    overflow-y: auto;
  }
</style>
