<!--
  Port of upstream webapp/IronCalc/src/components/SheetTabBar/SheetTab.tsx,
  read-only: selecting the sheet. Renaming, the tab menu (color, duplicate,
  hide, move, delete) and the delete dialog come with editing.
-->
<script lang="ts">
  interface Props {
    name: string;
    color: string;
    selected: boolean;
    onSelected: () => void;
  }

  let { name, color, selected, onSelected }: Props = $props();
</script>

<div
  class={["ic-sheet-tab", selected && "ic-sheet-tab--selected"]}
  style:border-bottom-color={color}
  role="tab"
  tabindex={selected ? 0 : -1}
  aria-selected={selected}
  onclick={(event) => {
    onSelected();
    event.stopPropagation();
    event.preventDefault();
  }}
  onkeydown={(event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelected();
    }
  }}
>
  <div class="ic-sheet-tab-name">{name}</div>
</div>

<style>
  .ic-sheet-tab {
    display: flex;
    align-items: center;
    min-width: 40px;
    margin-right: 12px;
    padding: 0 6px;
    line-height: 37px;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    font-weight: 400;
    color: var(--palette-common-black);
  }

  .ic-sheet-tab--selected {
    font-weight: 600;
    background-color: var(--palette-grey-50);
  }

  .ic-sheet-tab:hover {
    background-color: var(--palette-grey-200);
  }

  .ic-sheet-tab-name {
    width: 100%;
    font-size: 12px;
    text-align: center;
    white-space: nowrap;
    user-select: none;
  }

  @media (max-width: 769px) {
    .ic-sheet-tab {
      margin-right: 4px;
    }
  }
</style>
