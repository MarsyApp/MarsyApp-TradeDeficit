using Newtonsoft.Json.Linq;
using System;
using UnityEngine;
using UnityEngine.Assertions;

namespace TradeDeficit
{
    public class ModInformation
    {
        public string path;

        public static ModInformation Load()
        {
            ModInformation ModInfo;

            JObject response = JObject.Parse(Aki.Common.Http.RequestHandler.GetJson($"/TradeDeficit/GetInfo"));
            try
            {
                Assert.IsTrue(response.Value<int>("status") == 0);
                ModInfo = response["data"].ToObject<ModInformation>();
            }
            catch (Exception getModInfoException)
            {
                string errMsg = $"[{typeof(TradeDeficit)}] Package.json couldn't be found! Make sure you've installed the mod on the server as well!";
                Debug.LogError(errMsg);
                throw getModInfoException;
            }

            return ModInfo;
        }
    }
}
