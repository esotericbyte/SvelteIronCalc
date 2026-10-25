<!--
  Port of upstream webapp/IronCalc/src/components/FormatMenu/FormatPicker.tsx:
  the custom number format prompt, starting with the current format.
-->
<script lang="ts">
  import { t } from "../../i18n";
  import Prompt from "../Modal/Prompt.svelte";

  interface Props {
    class?: string;
    open: boolean;
    onClose: () => void;
    numFmt: string;
    onChange: (numberFmt: string) => void;
  }

  let { class: className, open, onClose, numFmt, onChange }: Props = $props();
</script>

<Prompt
  {open}
  {onClose}
  onSubmit={onChange}
  title={t("num_fmt.title")}
  class={className}
  defaultValue={numFmt}
  cancelLabel={t("num_fmt.cancel")}
  confirmLabel={t("num_fmt.save")}
  closeLabel={t("num_fmt.close")}
/>
