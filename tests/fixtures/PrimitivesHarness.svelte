<!-- Renders the exported UI primitives for tests/primitives.test.ts. -->
<script lang="ts">
  import Star from "@lucide/svelte/icons/star";
  import {
    Button,
    Checkbox,
    Confirm,
    IconButton,
    Input,
    Menu,
    MenuDivider,
    MenuItem,
    MenuItemWithSubmenu,
    ToggleButton,
    Tooltip,
  } from "../../src/lib";
  import Prompt from "../../src/lib/components/Modal/Prompt.svelte";

  interface Props {
    log: (entry: string) => void;
  }

  let { log }: Props = $props();

  let confirmOpen = $state(false);
  let promptOpen = $state(false);
  let checked = $state(false);
  let single: "left" | "right" = $state("left");
  let several: string[] = $state(["bold"]);
  let amount: string | number = $state("5");
</script>

<Button onclick={() => (confirmOpen = true)}>Ask</Button>
<Button variant="secondary" onclick={() => (promptOpen = true)}>Name</Button>
<Tooltip title="Starred">
  <IconButton aria-label="Star" onclick={() => log("star")}>
    {#snippet icon()}<Star />{/snippet}
  </IconButton>
</Tooltip>

<Menu>
  {#snippet trigger(attributes)}
    <Button {...attributes} variant="outline">Actions</Button>
  {/snippet}
  <MenuItem onClick={() => log("first")}>First</MenuItem>
  <MenuItem disabled onClick={() => log("disabled")}>Disabled</MenuItem>
  <MenuDivider />
  <MenuItemWithSubmenu>
    {#snippet submenu()}
      <MenuItem onClick={() => log("nested")}>Nested</MenuItem>
    {/snippet}
    More
  </MenuItemWithSubmenu>
</Menu>

<Checkbox {checked} onChange={(value) => (checked = value)} label="Agree" />
<span data-testid="checked">{checked}</span>

<ToggleButton
  options={[
    { value: "left", label: "Left" },
    { value: "right", label: "Right" },
  ]}
  value={single}
  onChange={(value: "left" | "right") => (single = value)}
/>
<ToggleButton
  multiple
  options={[
    { value: "bold", "aria-label": "Bold", icon: boldIcon },
    { value: "italic", "aria-label": "Italic", icon: boldIcon },
  ]}
  value={several}
  onChange={(values) => (several = values)}
/>
{#snippet boldIcon()}<Star />{/snippet}
<span data-testid="toggles">{single} {several.join(",")}</span>

<Input type="number" bind:value={amount} min={0} max={6} label="Amount" endAdornment="px" />
<span data-testid="amount">{amount}</span>

<Confirm
  open={confirmOpen}
  onClose={() => {
    confirmOpen = false;
    log("closed");
  }}
  onConfirm={() => log("confirmed")}
  title="Really?"
  message="This cannot be undone."
  confirmLabel="Do it"
  variant="destructive"
/>
<Prompt
  open={promptOpen}
  onClose={() => (promptOpen = false)}
  onSubmit={(value) => log(`submitted ${value}`)}
  title="Name it"
  defaultValue="Draft"
/>
