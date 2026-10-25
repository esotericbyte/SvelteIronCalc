<!--
  Port of upstream webapp/IronCalc/src/components/LinkDialog/LinkDialog.tsx:
  adds a link to a cell or edits the one it has. Three tabs: an external
  URL, a place in the document (a sheet and a cell reference or a defined
  name) and an email (address, subject and body; other mailto parameters of
  an edited link are kept). Every tab has the link's tooltip and the cell's
  label. Errors show once something is typed, and Save stays disabled while
  the link is not valid; when editing, clearing the main field of the link's
  own tab and saving removes the link. The validation helpers are carried
  from upstream (`upstream/components/LinkDialog/util.ts`). It is built on
  ModalDialog.svelte, so Escape closes it and Ctrl/Cmd+Enter saves.
-->
<script lang="ts">
  import { type Link, quoteName } from "@ironcalc/wasm";
  import Check from "@lucide/svelte/icons/check";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { t } from "../../i18n";
  import {
    buildMailto,
    CELL_REFERENCE_REGEX,
    DEFINED_NAME_REGEX,
    isValidEmail,
    normalizeUrl,
    parseLocation,
    parseMailto,
  } from "../../upstream/components/LinkDialog/util";
  import Button from "../Button/Button.svelte";
  import Input from "../Input/Input.svelte";
  import ModalDialog from "../Modal/ModalDialog.svelte";
  import Select from "../Select/Select.svelte";
  import ToggleButton, {
    type ToggleButtonOption,
  } from "../ToggleButton/ToggleButton.svelte";

  type LinkDialogTab = "external" | "document" | "email";

  interface Props {
    open: boolean;
    onClose: () => void;
    /** The names of the sheets in the workbook, for the document link tab */
    sheetNames: string[];
    /** The name of the sheet the cell is in (initial value of the sheet select) */
    selectedSheetName: string;
    /** The link currently in the cell: null means the dialog adds a new link */
    initialLink: Link | null;
    /** The content of the cell, used to pre-fill the label input */
    initialLabel: string;
    onSave: (link: Link, label: string) => void;
    onDelete: () => void;
  }

  let {
    open,
    onClose,
    sheetNames,
    selectedSheetName,
    initialLink,
    initialLabel,
    onSave,
    onDelete,
  }: Props = $props();

  let tab = $state<LinkDialogTab>("external");
  // the tab the edited link belongs to (null when adding a new link)
  let initialTab = $state<LinkDialogTab | null>(null);
  let url = $state("");
  let email = $state("");
  let subject = $state("");
  let body = $state("");
  // mailto query parameters other than the subject and the body (e.g. cc):
  // not shown in the dialog but preserved when the link is saved
  let emailExtraParams = $state("");
  // svelte-ignore state_referenced_locally
  let sheetName = $state(selectedSheetName);
  let cellRef = $state("");
  let tooltip = $state("");
  let label = $state("");

  let mainInput: HTMLInputElement | null = $state(null);

  $effect.pre(() => {
    if (!open) {
      return;
    }
    label = initialLabel;
    tooltip = initialLink?.tooltip || "";
    url = "";
    email = "";
    subject = "";
    body = "";
    emailExtraParams = "";
    sheetName = selectedSheetName;
    cellRef = "";
    if (!initialLink) {
      tab = "external";
      initialTab = null;
    } else if (initialLink.type === "Internal") {
      tab = "document";
      initialTab = "document";
      const location = parseLocation(initialLink.location);
      if (location.sheetName) {
        sheetName = location.sheetName;
      }
      cellRef = location.cellRef.replace(/\$/g, "");
    } else if (initialLink.target.startsWith("mailto:")) {
      tab = "email";
      initialTab = "email";
      const mailto = parseMailto(initialLink.target);
      email = mailto.address;
      subject = mailto.subject;
      body = mailto.body;
      emailExtraParams = mailto.otherParams;
    } else {
      tab = "external";
      initialTab = "external";
      url = initialLink.target;
    }
  });

  // Validation. Error messages only show once there is something typed,
  // but the save button stays disabled while the link is not valid.
  const urlError = $derived(tab === "external" && url.trim() !== "" && !normalizeUrl(url));
  const emailError = $derived(tab === "email" && email.trim() !== "" && !isValidEmail(email));
  const trimmedCellRef = $derived(cellRef.replace(/\$/g, "").trim());
  const cellRefValid = $derived(
    CELL_REFERENCE_REGEX.test(trimmedCellRef) || DEFINED_NAME_REGEX.test(trimmedCellRef),
  );
  const cellRefError = $derived(tab === "document" && cellRef.trim() !== "" && !cellRefValid);

  // When editing a link, clearing its main field and saving removes the link.
  // Only on the tab the link belongs to: an empty field in one of the other
  // tabs just means nothing was entered there.
  const mainFieldEmpty = $derived(
    {
      external: url.trim() === "",
      document: cellRef.trim() === "",
      email: email.trim() === "",
    }[tab],
  );
  const deleteOnSave = $derived(initialTab !== null && tab === initialTab && mainFieldEmpty);

  const canSave = $derived.by(() => {
    switch (tab) {
      case "external":
        return deleteOnSave || normalizeUrl(url) !== null;
      case "document":
        return deleteOnSave || (cellRef.trim() !== "" && cellRefValid);
      case "email":
        return deleteOnSave || (email.trim() !== "" && isValidEmail(email));
    }
    return deleteOnSave;
  });

  function buildLink(): Link | null {
    const linkTooltip = tooltip.trim() || undefined;
    switch (tab) {
      case "external": {
        const target = normalizeUrl(url);
        if (!target) {
          return null;
        }
        return { type: "External", target, tooltip: linkTooltip };
      }
      case "email": {
        if (!isValidEmail(email)) {
          return null;
        }
        // the address input may itself carry mailto parameters
        // ("a@b.com?subject=Hi"): the subject/body fields win over inline ones
        const inline = parseMailto(email.trim());
        const subjectValue = subject.trim() || inline.subject;
        const bodyValue = body.trim() || inline.body;
        const otherParams = [inline.otherParams, emailExtraParams].filter(Boolean).join("&");
        return {
          type: "External",
          target: buildMailto(inline.address, subjectValue, bodyValue, otherParams),
          tooltip: linkTooltip,
        };
      }
      case "document": {
        let location: string;
        if (CELL_REFERENCE_REGEX.test(trimmedCellRef)) {
          location = `${quoteName(sheetName)}!${trimmedCellRef.toUpperCase()}`;
        } else if (DEFINED_NAME_REGEX.test(trimmedCellRef)) {
          // a defined name
          location = trimmedCellRef;
        } else {
          return null;
        }
        return { type: "Internal", location, tooltip: linkTooltip };
      }
    }
    return null;
  }

  function handleSave(): void {
    if (deleteOnSave) {
      onDelete();
      onClose();
      return;
    }
    const link = buildLink();
    if (!link) {
      return;
    }
    onSave(link, label);
    onClose();
  }

  function handleDelete(): void {
    onDelete();
    onClose();
  }

  const tabs: ToggleButtonOption<LinkDialogTab>[] = [
    { value: "external", label: t("link_dialog.external_tab") },
    { value: "document", label: t("link_dialog.document_tab") },
    { value: "email", label: t("link_dialog.email_tab") },
  ];

  // The main field of the tab shown takes the focus, as upstream's autoFocus
  function focusOnMount(element: HTMLInputElement): void {
    element.focus();
  }
</script>

<ModalDialog
  {open}
  {onClose}
  onConfirm={handleSave}
  title={initialLink ? t("link_dialog.title_edit") : t("link_dialog.title_add")}
  closeLabel={t("link_dialog.close")}
  initialFocus={() => mainInput}
  class="ic-link-dialog"
>
  <ToggleButton
    fullWidth
    size="md"
    class="ic-link-dialog-tabs"
    options={tabs}
    value={tab}
    onChange={(value: LinkDialogTab) => (tab = value)}
  />
  {#if tab === "external"}
    <Input
      bind:ref={mainInput}
      placeholder={t("link_dialog.url_placeholder")}
      bind:value={url}
      error={urlError}
      helperText={urlError ? t("link_dialog.invalid_url") : undefined}
      {@attach focusOnMount}
    />
  {:else if tab === "document"}
    <Select
      value={sheetName}
      options={sheetNames.map((name) => ({ value: name, label: name }))}
      onChange={(value) => (sheetName = value)}
    />
    <Input
      bind:ref={mainInput}
      placeholder={t("link_dialog.cell_reference_placeholder")}
      bind:value={cellRef}
      error={cellRefError}
      helperText={cellRefError ? t("link_dialog.invalid_reference") : undefined}
      {@attach focusOnMount}
    />
  {:else}
    <Input
      bind:ref={mainInput}
      placeholder={t("link_dialog.email_placeholder")}
      bind:value={email}
      error={emailError}
      helperText={emailError ? t("link_dialog.invalid_email") : undefined}
      {@attach focusOnMount}
    />
    <Input placeholder={t("link_dialog.subject_placeholder")} bind:value={subject} />
    <Input placeholder={t("link_dialog.body_placeholder")} bind:value={body} />
  {/if}
  <Input placeholder={t("link_dialog.tooltip_placeholder")} bind:value={tooltip} />
  <Input placeholder={t("link_dialog.label_placeholder")} bind:value={label} />
  {#snippet footer()}
    {#if initialLink}
      <Button size="md" variant="ghost" class="ic-link-dialog-delete" onclick={handleDelete}>
        {#snippet startIcon()}<Trash2 size={14} />{/snippet}
        {t("link_dialog.delete")}
      </Button>
    {:else}
      <span></span>
    {/if}
    <Button size="md" onclick={handleSave} disabled={!canSave}>
      {#snippet startIcon()}<Check size={14} />{/snippet}
      {t("link_dialog.save")}
    </Button>
  {/snippet}
</ModalDialog>

<style>
  /* Port of upstream LinkDialog/link-dialog.css */
  :global(.ic-link-dialog .ic-link-dialog-tabs) {
    margin-bottom: 4px;
  }

  :global(.ic-link-dialog .ic-modal-dialog-footer) {
    justify-content: space-between;
  }

  :global(.ic-link-dialog .ic-link-dialog-delete) {
    color: var(--palette-error-main);
  }

  :global(.ic-link-dialog .ic-link-dialog-delete:hover) {
    color: var(--palette-error-dark);
  }
</style>
