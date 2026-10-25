<!--
  Development demo: open an .xlsx file (or the generated sample) in the
  widget, edit it, and download the model back as .xlsx. The lock button
  switches the widget to read-only (`canEdit={false}`), which also hides the
  toolbar. The toolbar opens the number format, merge and theme menus, the
  color and border pickers and the link dialog (also reached from the link
  tooltip of the sample's link); right-click the cells, the column or row
  headers and the sheet tabs for their menus. Going back to the sample asks
  first, with the exported Confirm dialog. The header shows the exported
  IronCalcIcon.
-->
<script lang="ts">
  import Download from "@lucide/svelte/icons/download";
  import FileSpreadsheet from "@lucide/svelte/icons/file-spreadsheet";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import Lock from "@lucide/svelte/icons/lock";
  import LockOpen from "@lucide/svelte/icons/lock-open";
  import Moon from "@lucide/svelte/icons/moon";
  import Sun from "@lucide/svelte/icons/sun";
  import { onMount } from "svelte";
  import {
    Confirm,
    darkThemeVariables,
    init,
    IronCalc,
    IronCalcIcon,
    type Model,
  } from "$lib";
  import { downloadXlsx, initXlsx, modelFromXlsx } from "$lib/xlsx";
  import { buildSampleWorkbook } from "./sampleWorkbook";

  let model: Model | null = $state(null);
  let fileName = $state("sample.xlsx");
  let error: string | null = $state(null);
  let loading = $state(true);
  let dark = $state(false);
  let readOnly = $state(false);
  let fileInput: HTMLInputElement | null = $state(null);
  let confirmSample = $state(false);

  onMount(async () => {
    try {
      await Promise.all([init(), initXlsx()]);
      model = buildSampleWorkbook();
    } catch (e) {
      error = `Could not start the engine: ${e}`;
    } finally {
      loading = false;
    }
  });

  async function openFile(file: File): Promise<void> {
    error = null;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      model = modelFromXlsx(bytes, file.name.replace(/\.xlsx$/i, ""));
      fileName = file.name;
    } catch (e) {
      error = `Could not open ${file.name}: ${e}`;
    }
  }
</script>

<div class="flex h-full flex-col">
  <header
    class="flex flex-wrap items-center gap-2 border-b border-surface-200-800 px-4 py-2"
  >
    <h1 class="h6 mr-auto flex items-center gap-2">
      <IronCalcIcon width={20} height={20} />ironcalc-svelte
    </h1>
    <input
      bind:this={fileInput}
      type="file"
      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      class="hidden"
      data-testid="xlsx-file-input"
      onchange={(event) => {
        const file = event.currentTarget.files?.[0];
        if (file) {
          openFile(file);
        }
        event.currentTarget.value = "";
      }}
    />
    <button
      type="button"
      class="btn btn-sm preset-filled-primary-500"
      disabled={loading}
      onclick={() => fileInput?.click()}
    >
      <FolderOpen size={16} /> Open .xlsx
    </button>
    <button
      type="button"
      class="btn btn-sm preset-tonal"
      disabled={loading}
      onclick={() => (confirmSample = true)}
    >
      <FileSpreadsheet size={16} /> Sample
    </button>
    <button
      type="button"
      class="btn btn-sm preset-tonal"
      disabled={!model}
      onclick={() => model && downloadXlsx(model, fileName)}
    >
      <Download size={16} /> Download .xlsx
    </button>
    <button
      type="button"
      class="btn-icon btn-icon-sm preset-tonal"
      aria-label={readOnly ? "Allow editing" : "Make read-only"}
      aria-pressed={readOnly}
      title={readOnly ? "Allow editing" : "Make read-only"}
      onclick={() => (readOnly = !readOnly)}
    >
      {#if readOnly}<Lock size={16} />{:else}<LockOpen size={16} />{/if}
    </button>
    <button
      type="button"
      class="btn-icon btn-icon-sm preset-tonal"
      aria-label={dark ? "Light theme" : "Dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
      onclick={() => (dark = !dark)}
    >
      {#if dark}<Sun size={16} />{:else}<Moon size={16} />{/if}
    </button>
  </header>
  {#if error}
    <div class="preset-tonal-error px-4 py-2 text-sm" role="alert">{error}</div>
  {/if}
  <Confirm
    open={confirmSample}
    onClose={() => (confirmSample = false)}
    onConfirm={() => {
      model = buildSampleWorkbook();
      fileName = "sample.xlsx";
      error = null;
    }}
    title="Open the sample?"
    message="The workbook shown is replaced by the sample; download it first to keep your changes."
    confirmLabel="Open the sample"
    variant="destructive"
  />
  <main class="relative min-h-0 flex-1">
    {#if loading}
      <p class="p-4">Loading the engine…</p>
    {:else if model}
      <IronCalc
        {model}
        canEdit={!readOnly}
        themeVariables={dark ? darkThemeVariables : undefined}
      />
    {/if}
  </main>
</div>
