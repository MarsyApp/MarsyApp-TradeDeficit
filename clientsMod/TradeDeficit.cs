using System;
using System.Collections;
using EFT.InventoryLogic;
using System.IO;
using BepInEx;
using UnityEngine;

namespace TradeDeficit
{
    [BepInPlugin("com.MarsyApp.TradeDeficit", "MarsyApp-TradeDeficit", "1.0.0")]
    public class TradeDeficit : BaseUnityPlugin
    {
        private void Awake()
        {
            _ = Resources.LoadTexture("icon_trade_deficit", Path.Combine(ModInfo.path, "res/icon_trade_deficit.png"));
            Patcher.PatchAll();
            Logger.LogInfo($"Plugin TradeDeficit is loaded!");
        }
        
        private void OnDestroy()
        {
            Patcher.UnpatchAll();
            Logger.LogInfo($"Plugin TradeDeficit is unloaded!");
        }

        private static ModInformation _modInfo;
        public static ModInformation ModInfo
        {
            private set
            {
                _modInfo = value;
            }
            get
            {
                if (_modInfo == null)
                    _modInfo = ModInformation.Load();
                return _modInfo;
            }
        }
        
        private static TradeDeficitItemsData _tradeDeficitItemsData;
        public static bool TradeDeficitItemsLoaded = false;
        public static TradeDeficitItemsData TradeDeficitItemsData
        {
            set
            {
                _tradeDeficitItemsData = value;
            }
            get
            {
                if (_tradeDeficitItemsData == null && !TradeDeficitItemsLoaded)
                {
                    TradeDeficitItemsLoaded = true;
                    _tradeDeficitItemsData = TradeDeficitItemsData.Load();
                }
                return _tradeDeficitItemsData;
            }
        }

        private static Transform _gameObjectStorage;
        public static Transform GameObjectStorage
        {
            get
            {
                if (_gameObjectStorage == null)
                {
                    GameObject storage = new GameObject("TradeDeficit Storage");
                    DontDestroyOnLoad(storage);
                    storage.SetActive(false);
                    _gameObjectStorage = storage.transform;
                }

                return _gameObjectStorage;
            }
        }

        public static bool DontTrade(Item item)
        {
            return !(TradeDeficitItemsData.TradeDeficitItems.Contains(item.Template._id) || TradeDeficitItemsData.TradeDeficitItemsIgnore.Contains(item.Template._id));
        }
    }
}
