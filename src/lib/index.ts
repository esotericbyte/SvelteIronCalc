// Public entry of ironcalc-svelte. See docs/parity.md for what is ported so far.
import initWasm, { Model } from "@ironcalc/wasm";
import Button from "./components/Button/Button.svelte";
import IconButton from "./components/Button/IconButton.svelte";
import Checkbox from "./components/Checkbox/Checkbox.svelte";
import { IronCalcIcon, IronCalcIconWhite, IronCalcLogo } from "./components/icons";
import Input from "./components/Input/Input.svelte";
import IronCalc from "./components/IronCalc.svelte";
import Menu from "./components/Menu/Menu.svelte";
import MenuDivider from "./components/Menu/MenuDivider.svelte";
import MenuItem from "./components/Menu/MenuItem.svelte";
import MenuItemWithSubmenu from "./components/Menu/MenuItemWithSubmenu.svelte";
import Confirm from "./components/Modal/Confirm.svelte";
import Switch from "./components/Switch/Switch.svelte";
import ToggleButton from "./components/ToggleButton/ToggleButton.svelte";
import Tooltip from "./components/Tooltip/Tooltip.svelte";
import Workbook from "./components/Workbook/Workbook.svelte";

export type {
  ButtonProperties,
  ButtonSize,
  ButtonVariant,
} from "./components/Button/Button.svelte";
export type { IconButtonProperties } from "./components/Button/IconButton.svelte";
export type { CheckboxProperties } from "./components/Checkbox/Checkbox.svelte";
export type {
  InputProperties,
  InputSize,
} from "./components/Input/Input.svelte";
export type { MenuProperties } from "./components/Menu/Menu.svelte";
export type { MenuItemProperties } from "./components/Menu/MenuItem.svelte";
export type { MenuItemWithSubmenuProps } from "./components/Menu/MenuItemWithSubmenu.svelte";
export type { ConfirmProperties } from "./components/Modal/Confirm.svelte";
export type { SwitchProperties } from "./components/Switch/Switch.svelte";
export type {
  ToggleButtonOption,
  ToggleButtonProperties,
} from "./components/ToggleButton/ToggleButton.svelte";
export type { TooltipProperties } from "./components/Tooltip/Tooltip.svelte";
export {
  darkThemeVariables,
  defaultThemeVariables,
  setThemeVariables,
  unsetThemeVariables,
} from "./upstream/theme";
export type { PartialIronCalcThemeVariables } from "./upstream/theme";
export { WorkbookState } from "./upstream/components/workbookState";
export {
  Button,
  Checkbox,
  Confirm,
  IconButton,
  Input,
  IronCalc,
  IronCalcIcon,
  IronCalcIconWhite,
  IronCalcLogo,
  Menu,
  MenuDivider,
  MenuItem,
  MenuItemWithSubmenu,
  Model,
  Switch,
  ToggleButton,
  Tooltip,
  Workbook,
};

/** Initializes the `@ironcalc/wasm` engine; await it before creating a model. */
export const init: typeof initWasm = (moduleOrPath) => initWasm(moduleOrPath);
