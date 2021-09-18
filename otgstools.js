const axios = require("axios")
var http=require("http");
var server=http.createServer();

const chainHttpProvider = "https://otgschain.otgs.finance" 
const Account = require("@sealsc/sealabc-js-sdk/dist/sealabc-js-sdk").Account
const sealabcUtils = require("@sealsc/sealabc-js-sdk/dist/sealabc-js-sdk").util
let network = require("@sealsc/sealabc-js-sdk/dist/sealabc-js-sdk").network
                
server.on("request",function(request,response){
	var url=request.url;
	if(url=="/getAddress"){
		//example start: 生成地址     
		//给私钥、种子生成对应账户，如果不给参数，则生成一个新的账户
		let newAcc = new Account()
		let address = newAcc.smartAssets.hexAddress()
		let privateKey = newAcc.smartAssets.signer.keyPair.privateKey.hex
		response.end('{\"address\":\"'+address+'\",\"privateKey\":\"'+privateKey+"\"}")
	}else if(url=="/sendTransaction"){
    	let newAcc = new Account(request.priKey)
		response.end(address+","+privateKey)
				
		//这里使用axios作为api client的底层通讯sdk，进行简单封装
		let axiosClient = new function () {
			this.post = function (url, data) {
			  return axios.post(
				url, data,
				{
				  headers:  { 
					'Content-Type': 'application/json',
					'OTGS-Key': '6bccadfe4e1f0e2f9e8d580fd9999aa4eccf4d0653d3361dc4a93d26f3795a63'
				  }
				}) 
			}
		  }()

		//生成apiClient对象
		let apiClient = new network.ApiClient({
			httpRequester: axiosClient,
			apiBaseUrl: chainHttpProvider
		})

		//设置apiClient对象到账户，就可以使用账户的跟节点交互的功能了
		newAcc.setApiClient(apiClient)

		//获取签名后的转账交易JSON字符串
		//第一个参数为资产接收地址，得个参数为转账数量，第三个参数为转账备注信息
		//注意：转账数量一定为正整数，精度为4位，如：转账 1 OTGS， 则此处参数填写为：10000
		let txJSON = newAcc.smartAssets.buildTransferTx('1c4748eed6ee174bf7ad545502a876010b0a2718dee92e34ed23c161aa5290ba', "10000", 'tx test')

		//从JSON字符串中获取txID
		let txObj = JSON.parse(txJSON)
		let txData = sealabcUtils.converter.base64ToPlainObject(txObj.Data)
		let txID = sealabcUtils.converter.base64ToHex(txData.DataSeal.Hash)
		//此处得到的交易ID就是下面查询交易时的输入
		console.log("交易ID：", txID)

		//发送签名交易JSON字符串，执行转账
		//如果进cache，肯定交易就发送失败了，转账肯定不成功
		//如果进then，判断返回的 r 变量的success字段，如果为true，则说明交易正常被接收
		//交易是否成功，请在20s后，通过智能资产交易查询接口返回的 Result字段中的 Success标志进行判断
		newAcc.smartAssets.sendSignedTransaction(txJSON)
		  .then(r=>{console.log("tx result: ", r)})
		  .catch(e=>{console.log("tx failed: ")})
		response.end(txID)
	}
	
})
server.listen(3000,function(){
	console.log("服务器开启成功")
})


