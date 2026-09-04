type DeliveryChannel='email'|'sms'|'whatsapp'|'push';
export type DeliveryInput={channel:DeliveryChannel;title:string;body:string;email?:string|null;phone?:string|null;personId:string};
export type DeliveryResult={ok:boolean;provider:string;messageId?:string;error?:string};

function basic(user:string,pass:string){return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;}
async function json(res:Response){try{return await res.json() as Record<string,unknown>;}catch{return {};}}

export function providerReadiness(){return {
  email:Boolean(process.env.RESEND_API_KEY&&process.env.NOTIFICATION_EMAIL_FROM),
  sms:Boolean(process.env.TWILIO_ACCOUNT_SID&&process.env.TWILIO_AUTH_TOKEN&&process.env.TWILIO_SMS_FROM),
  whatsapp:Boolean(process.env.TWILIO_ACCOUNT_SID&&process.env.TWILIO_AUTH_TOKEN&&process.env.TWILIO_WHATSAPP_FROM),
  push:Boolean(process.env.ONESIGNAL_APP_ID&&process.env.ONESIGNAL_API_KEY),
};}

export async function deliverNotification(input:DeliveryInput):Promise<DeliveryResult>{
  if(input.channel==='email'){
    if(!process.env.RESEND_API_KEY||!process.env.NOTIFICATION_EMAIL_FROM)return {ok:false,provider:'resend',error:'Resend is not configured'};
    if(!input.email)return {ok:false,provider:'resend',error:'Recipient email unavailable'};
    try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:`Bearer ${process.env.RESEND_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({from:process.env.NOTIFICATION_EMAIL_FROM,to:[input.email],subject:input.title,text:input.body})});const b=await json(r);return r.ok?{ok:true,provider:'resend',messageId:String(b.id||'')}:{ok:false,provider:'resend',error:String(b.message||b.error||`HTTP ${r.status}`)};}catch(e){return {ok:false,provider:'resend',error:e instanceof Error?e.message:'Email delivery failed'};}
  }
  if(input.channel==='sms'||input.channel==='whatsapp'){
    const sid=process.env.TWILIO_ACCOUNT_SID,token=process.env.TWILIO_AUTH_TOKEN,from=input.channel==='sms'?process.env.TWILIO_SMS_FROM:process.env.TWILIO_WHATSAPP_FROM;
    if(!sid||!token||!from)return {ok:false,provider:'twilio',error:`Twilio ${input.channel} is not configured`};
    if(!input.phone)return {ok:false,provider:'twilio',error:'Recipient phone unavailable'};
    const to=input.channel==='whatsapp'?(input.phone.startsWith('whatsapp:')?input.phone:`whatsapp:${input.phone}`):input.phone;
    const fromValue=input.channel==='whatsapp'?(from.startsWith('whatsapp:')?from:`whatsapp:${from}`):from;
    const form=new URLSearchParams({To:to,From:fromValue,Body:`${input.title}\n${input.body}`});
    try{const r=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,{method:'POST',headers:{authorization:basic(sid,token),'content-type':'application/x-www-form-urlencoded'},body:form});const b=await json(r);return r.ok?{ok:true,provider:'twilio',messageId:String(b.sid||'')}:{ok:false,provider:'twilio',error:String(b.message||`HTTP ${r.status}`)};}catch(e){return {ok:false,provider:'twilio',error:e instanceof Error?e.message:'Twilio delivery failed'};}
  }
  if(input.channel==='push'){
    if(!process.env.ONESIGNAL_APP_ID||!process.env.ONESIGNAL_API_KEY)return {ok:false,provider:'onesignal',error:'OneSignal push is not configured'};
    try{const r=await fetch('https://api.onesignal.com/notifications',{method:'POST',headers:{authorization:`Key ${process.env.ONESIGNAL_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({app_id:process.env.ONESIGNAL_APP_ID,target_channel:'push',include_aliases:{external_id:[input.personId]},headings:{en:input.title},contents:{en:input.body}})});const b=await json(r);return r.ok?{ok:true,provider:'onesignal',messageId:String(b.id||'')}:{ok:false,provider:'onesignal',error:String(b.errors||b.message||`HTTP ${r.status}`)};}catch(e){return {ok:false,provider:'onesignal',error:e instanceof Error?e.message:'Push delivery failed'};}
  }
  return {ok:false,provider:'unknown',error:'Unsupported channel'};
}
