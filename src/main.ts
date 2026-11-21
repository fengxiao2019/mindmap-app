import { createApp } from "./app";
import { registerSW } from "virtual:pwa-register";

createApp();

// Make the app installable and usable offline (auto-updates in the background).
registerSW({ immediate: true });
