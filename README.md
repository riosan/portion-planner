# Portion Planner PWA

**Portion Planner** is a progressive web application (PWA) designed to automate and optimize the scheduling of dough batches and baking portions in professional bakery production. It calculates exact timing for every single portion, taking into account technological breaks, shift presets (including night shifts), and proportional additive adjustments.

---

## 👥 Authorship & License

* **Project Author:** Oleksii Yailov
* **Terms of Use:** This software is completely free **strictly and exclusively** for the **Bakkerij Nora** bakery. Any distribution or commercial use by other enterprises without the explicit consent of the author is strictly prohibited.

---

## ✨ Features

- **Dual-Language Interface:** Full support for English (`EN`) and Dutch (`NL`) languages.
- **Smart Formatting:** Numbers, weights, and time formats automatically adapt to the chosen locale (comma/dot decimal separators).
- **Shift Presets:** Built-in standard shifts (Standard, Morning shift, Evening shift) with the ability to save and delete custom user configurations.
- **Advanced Break Management:** Add an unlimited number of named custom breaks. The planner automatically pauses the schedule and resumes the portion calculations seamlessly after the break ends.
- **Midnight & Night Shift Support:** Accurate calculations for schedules transitioning past midnight (subsequent days are cleanly marked with a `+1` badge).
- **Incomplete Last Portion Calculation:** Calculates the precise partial weight of the final batch if the working hours cut off before a full cycle completes.
- **Proportional Additive Calculator:** Dynamically scales required amounts of ingredients (fat, water, sugar, flour) for each portion based on the target weight. It also supports and highlights negative adjustments.
- **Cloud & Local Storage:** Automatic synchronization of custom presets and execution history via Supabase when signed in with Google. Falls back to browser `localStorage` if offline or signed out.
- **Seamless Export:** One-click copying (`Copy schedule`) of the generated plan into a clean text format ready to be pasted into messaging apps.
- **Responsive & Smart UI:** Automatically collapses the middle sections of the results table if there are more than 8 portions to keep it highly readable on mobile screens. Includes a quick `Now` button to immediately capture the current time.
- **Mobile devices:**The application is fully adapted for mobile devices
---

## 📖 Quick User Guide

1. **Authentication (Optional):** Click the **"Sign in with Google"** button at the top of the interface. This secures your custom presets and calculation history, syncing them automatically across all your work devices.
2. **Set the Work Windows:** - Select a pre-configured schedule from the **Presets** dropdown OR
   - Manually enter your **Production start** and **Production end** times. Use the **"Now"** button to grab your current local time instantly.
3. **Configure Portion Rules:** Enter the time needed for one full portion cycle (**Full portion time, min**) and its target mass (**Full portion weight, kg**). If you are updating a plan mid-shift, you can adjust the **Current portion number** to reflect where you are.
4. **Input Additives:** If the active recipe requires specific bulk adjustments for the shift, fill out the **Additives per full portion** fields (Fat, Water, Sugar, Flour). The system will automatically compute the exact split ratios for every batch.
5. **Manage Breaks:** Click **"Add break"**, give it a clear description (e.g., *«Lunch»* or *«Knife Change»*), and set its timeline. The application will block out that window and carry over any active portions safely.
6. **Generate & Share:** Press the green **"Calculate"** button. Once your timeline populates, click **"Copy schedule"** to format the timeline into text and instantly paste it to your team's chat.

---

## 💻 Local Development Setup (Windows 11)

To run and serve the app locally for configuration or testing:

```powershell
cd path/to/your/project-folder
python -m http.server 8080