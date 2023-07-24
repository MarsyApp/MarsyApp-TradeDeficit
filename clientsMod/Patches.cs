using EFT.InventoryLogic;
using EFT.UI;
using EFT.UI.DragAndDrop;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;
using Aki.Reflection.Patching;
using System;
using EFT.UI.Ragfair;
using EFT.UI.SessionEnd;

namespace TradeDeficit
{
    class Patcher
    {
        public static void PatchAll()
        {
            new PatchManager().RunPatches();
        }
        
        public static void UnpatchAll()
        {
            new PatchManager().RunUnpatches();
        }
    }

    public class PatchManager
    {
        public PatchManager()
        {
            this._patches = new List<ModulePatch>
            {
                new ItemViewPatches.GridItemViewUpdateInfoPatch(),
                new ItemViewPatches.ItemViewInitPatch(),
                new ItemViewPatches.NewGridItemViewPatch(),
                // new ItemViewPatches.RagfairFilterWindowPatch(),
                new ItemViewPatches.SessionResultExitStatusShowPatch(),
                new ItemViewPatches.TransferItemsScreenShowPatch(),
                new ItemViewPatches.InventoryScreenShowPatch(),
                new ItemViewPatches.ModdingSelectableItemView_method_27_Patch()
            };
        }

        public void RunPatches()
        {
            foreach (ModulePatch patch in this._patches)
            {
                patch.Enable();
            }
        }
        
        public void RunUnpatches()
        {
            foreach (ModulePatch patch in this._patches)
            {
                patch.Disable();
            }
        }

        private readonly List<ModulePatch> _patches;
    }

    public static class ItemViewPatches
    {
        public static Dictionary<ItemView, TradeDeficitItemViewPanel> tradeDeficitPanels = new Dictionary<ItemView, TradeDeficitItemViewPanel>();

        public static void SetTradeDeficitItemViewPanel(this ItemView __instance)
        {
            if (!tradeDeficitPanels.TryGetValue(__instance, out TradeDeficitItemViewPanel tradeDeficitItemViewPanel))
                return;

            ItemUiContext itemUiContext = typeof(ItemView).GetField("ItemUiContext", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(__instance) as ItemUiContext;

            if (tradeDeficitItemViewPanel != null)
            {
                tradeDeficitItemViewPanel.Show(__instance.Item, __instance);
                return;
            }
        }

        public class NewGridItemViewPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(GridItemView).GetMethod("NewGridItemView", BindingFlags.Instance | BindingFlags.NonPublic);
            }

            [PatchPostfix]
            private static void PatchPostfix(ref GridItemView __instance, Item item)
            {
                if (tradeDeficitPanels.ContainsKey(__instance)) return;

                try
                {
                    QuestItemViewPanel questIconPanel = typeof(ItemView).GetField("_questsItemViewPanel", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(__instance) as QuestItemViewPanel;

                    TradeDeficitItemViewPanel tradeDeficitIconPanel = GameObject.Instantiate(Resources.GetEditOffsetWindowTemplate(questIconPanel), questIconPanel.transform.parent);
                    tradeDeficitIconPanel.transform.SetAsFirstSibling();
                    tradeDeficitPanels[__instance] = tradeDeficitIconPanel;
                    tradeDeficitIconPanel.gameObject.SetActive(TradeDeficit.DontTrade(__instance.Item));
                }
                catch (Exception message)
                {
                    Debug.LogError($"TradeDeficit Panel issue: {message}");
                    // Item doesn't have a "quest item" icon panel, so it's probably static
                }
            }
        }
        
        public class RagfairFilterWindowPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(RagfairFilterWindow).GetMethod("Show", BindingFlags.Instance | BindingFlags.Public);
            }

            [PatchPostfix]
            private static void PatchPostfix(ref RagfairFilterWindow __instance, RagFairClass ragfair)
            {
                GameObject asd = Resources.GetEditOffsetWindowTemplateTest();
                GameObject parr = GameObject.Find("ShowHourExpiration");

                GameObject tradeDeficitIconPanel = GameObject.Instantiate(Resources.GetEditOffsetWindowTemplateTest(), parr.transform.parent);
                tradeDeficitIconPanel.transform.SetAsFirstSibling();
                tradeDeficitIconPanel.SetActive(true);
                
                TradeDeficit.TradeDeficitItemsLoaded = false;
            }
        }

        public class ItemViewInitPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(ItemView).GetMethod("Init", BindingFlags.Instance | BindingFlags.NonPublic);
            }

            [PatchPostfix]
            private static void PatchPostfix(ref ItemView __instance)
            {
                __instance.SetTradeDeficitItemViewPanel();
            }
        }
        
        public class ModdingSelectableItemView_method_27_Patch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(ModdingSelectableItemView).GetMethod("method_27", BindingFlags.Instance | BindingFlags.NonPublic);
            }

            [PatchPostfix]
            private static void PatchPostfix(ref ModdingSelectableItemView __instance)
            {
                Logger.LogDebug("method_27");
                GameObject _missingInInventory = typeof(ModdingSelectableItemView).GetField("_missingInInventory", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(__instance) as GameObject;
                GameObject _infoIcons = typeof(ModdingSelectableItemView).GetField("_infoIcons", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(__instance) as GameObject;
                _missingInInventory.SetActive(false);
                _infoIcons.SetActive(true);
            }
        }

        public class GridItemViewUpdateInfoPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(GridItemView).GetMethod("UpdateInfo", BindingFlags.Instance | BindingFlags.Public);
            }

            [PatchPostfix]
            private static void PatchPostfix(ref GridItemView __instance)
            {
                if (!__instance.IsSearched)
                    return;

                if (!tradeDeficitPanels.TryGetValue(__instance, out TradeDeficitItemViewPanel tradeDeficitItemViewPanel))
                    return;
                tradeDeficitItemViewPanel.iconImage.gameObject.SetActive(TradeDeficit.DontTrade(__instance.Item));

                __instance.SetTradeDeficitItemViewPanel();
            }
        }
        
        public class SessionResultExitStatusShowPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(SessionResultExitStatus).GetMethod("Show", BindingFlags.Instance | BindingFlags.NonPublic);
            }

            [PatchPostfix]
            private static void PatchPostfix(ref SessionResultExitStatus __instance)
            {
                TradeDeficit.TradeDeficitItemsLoaded = false;
                TradeDeficit.TradeDeficitItemsData = null;
            }
        }
        
        public class TransferItemsScreenShowPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(TransferItemsScreen).GetMethod("Show", BindingFlags.Instance | BindingFlags.NonPublic);
            }

            [PatchPostfix]
            private static void PatchPostfix(ref TransferItemsScreen __instance)
            {
                TradeDeficit.TradeDeficitItemsLoaded = false;
                TradeDeficit.TradeDeficitItemsData = null;
            }
        }
        
        public class InventoryScreenShowPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(InventoryScreen).GetMethod("Show", BindingFlags.Instance | BindingFlags.NonPublic);
            }

            [PatchPostfix]
            private static void PatchPostfix(ref InventoryScreen __instance)
            {
                TradeDeficit.TradeDeficitItemsLoaded = false;
                TradeDeficit.TradeDeficitItemsData = null;
            }
        }
    }
}
