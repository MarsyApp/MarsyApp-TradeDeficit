using EFT.InventoryLogic;
using EFT.UI;
using EFT.UI.DragAndDrop;
using UnityEngine.UI;
using UnityEngine;

namespace TradeDeficit
{
	public class TradeDeficitItemViewPanel : UIElement
	{
		public Image iconImage;                 //_questIconImage
		public ItemView itemView;
        private static Sprite iconCache = null;
		private bool initialized;

		public void Init()
        {
			if (initialized) return;

			iconCache = Resources.iconCache["icon_trade_deficit"] ?? UnityEngine.Resources.Load<Sprite>("characteristics/icons/icon_info_faction");
			initialized = true;
		}

		private void Awake()
        {
			Init();
        }

		public void Show(Item item, ItemView itemView)
		{
			Init();
			
			this.itemView = itemView;
			if (TradeDeficit.DontTrade(item))
			{
				iconImage.sprite = iconCache;
				base.ShowGameObject();
			}
			else
			{
				base.HideGameObject();
			}
		}
	}
}
