<script>
  import HeaderCard from "../components/HeaderCard.svelte";
  import EntryCard from "../components/EntryCard.svelte";
  import {
    recent_games,
    experimental_games,
    old_games,
    game_headers,
  } from "../lib/data";
</script>

<div class="entry-container">
  {#each recent_games as item, index}
    {#if index == 0}
      <HeaderCard
        title={game_headers[index].title}
        description={game_headers[index].description}
      />
    {/if}
    <EntryCard
      title={item.title}
      description={item.description}
      link={item.link}
      link_title={item.link_title}
      image={item.image}
      metadata={item.metadata}
    />
  {/each}

  {#each experimental_games as item, index}
    {#if index == 0}
      <HeaderCard
        title={game_headers[index + 1].title}
        description={game_headers[index + 1].description}
      />
    {/if}
    <EntryCard
      title={item.title}
      description={item.description}
      link={item.link}
      link_title={item.link_title}
      image={item.image}
      metadata={item.metadata}
    />
  {/each}

  {#each old_games as item, index}
    {#if index == 0}
      <HeaderCard
        title={game_headers[index + 2].title}
        description={game_headers[index + 2].description}
      />
    {/if}
    <EntryCard
      title={item.title}
      description={item.description}
      link={item.link}
      link_title={item.link_title}
      image={item.image}
      metadata={item.metadata}
    />
  {/each}
</div>

<style>
  .entry-container {
    background-color: #fff;
    border: 1px solid #000;
    max-height: 600px;
    overflow-y: auto;
  }
</style>
