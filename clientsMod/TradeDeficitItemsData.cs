using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Assertions;

namespace TradeDeficit
{
    public class TradeDeficitItemsData
    {
        public IList<string> TradeDeficitItems { get; set; }
        public IList<string> TradeDeficitItemsIgnore { get; set; }

        public static TradeDeficitItemsData Load()
        {
            Debug.Log("Loading TradeDeficitItems");
            TradeDeficitItemsData Tires = new TradeDeficitItemsData();

            JObject response = JObject.Parse(Aki.Common.Http.RequestHandler.GetJson($"/TradeDeficit/GetData"));
            try
            {
                Assert.IsTrue(response.Value<int>("status") == 0);
                Tires = response["data"].ToObject<TradeDeficitItemsData>();
            }
            catch (Exception getModInfoException)
            {
                string errMsg = $"[{typeof(TradeDeficit)}] Package.json couldn't be found! Make sure you've installed the mod on the server as well!";
                Debug.LogError(errMsg);
                throw getModInfoException;
            }
            return Tires;
        }
    }
}
