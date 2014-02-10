package com.phonegap.plugins.downloader;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;
import android.os.Build;
import android.os.Environment;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;

import org.apache.cordova.PluginResult;

public class Downloader extends CordovaPlugin {

	private CallbackContext context;
	
	@Override
	public boolean execute(String pAction, JSONArray aArgs, CallbackContext callbackContext)  {
		Log.d("PhoneGapLog", "DOWNLOAD PLUGIN STARTED");
        this.context = callbackContext;
		
		try {
			String vFileUrl = aArgs.getString(0);
			JSONObject vParams = aArgs.getJSONObject(1);

			String vFileName = vParams.has("fileName") ? 
					vParams.getString("fileName"):
					vFileUrl.substring(vFileUrl.lastIndexOf("/")+1);

			String vDirName = vParams.has("dirName") ?
					vParams.getString("dirName"):
					"sdcard/download";
					
			Boolean vForced = vParams.has("Forced") ?
					vParams.has("Forced") :
					false;
					
			File vDir = new File(vDirName);
			if (!vDir.exists()) {
				 File root = Environment.getExternalStorageDirectory();
	             if (root.canWrite()) {	
	            	 Log.d("PhoneGapLog", "EXTERNAL STORAGE DIR: " + root.getAbsolutePath());
	            	 if (vDir.mkdirs())	            		 
	            		 Log.d("PhoneGapLog", "directory " + vDirName + " created");
	            	 else
	            		 Log.d("PhoneGapLog", "directory " + vDirName + " was not created");
	             }
	             else
	            	 Log.d("PhoneGapLog", "CAN'T WRITE TO ROOT");	            	 
			}			
					
			PluginResult vResult;
			if (pAction.equals("preload")) {
				File vFile = new File(vDirName, vFileName);
				if (vForced || !vFile.exists()) {
					byte[] vData = downloadUrl(vFileUrl);
					if (vData.length > 0) {
						if (saveToFile(vFile, vData))
							vResult = new PluginResult(PluginResult.Status.OK, "file:///" + vDirName + "/" + vFileName);
						else 							
							vResult = new PluginResult(PluginResult.Status.ERROR, "Save to File Error");
						
						vData = null;						
					}
					else
						vResult = new PluginResult(PluginResult.Status.ERROR, "Download File Error");
					
					vFile = null;
				}
				else
					vResult = new PluginResult(PluginResult.Status.OK, "file:///" + vDirName + "/" + vFileName);
			}
			else
				vResult = new PluginResult(PluginResult.Status.INVALID_ACTION, "INVALID ACTION DETECTED: " + pAction);
						
//			vResult.setKeepCallback(true);				
//			if (vResult.getStatus() == PluginResult.Status.OK.ordinal())
//				success(vResult, pCallbackId);
//			else
//				error(vResult, pCallbackId);

			Log.d("PhoneGapLog", "DOWNLOAD PLUGIN FINISHED");
			this.context.sendPluginResult(vResult);
			return true;
			
		} catch (JSONException e) {
			//e.printStackTrace();
			//return new PluginResult(PluginResult.Status.JSON_EXCEPTION, e.getMessage());
			this.context.sendPluginResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
			return true;
			
		} catch (InterruptedException e) {
			//e.printStackTrace();
			//return new PluginResult(PluginResult.Status.ERROR, e.getMessage());
			this.context.sendPluginResult(new PluginResult(PluginResult.Status.ERROR));
			return true;
		}

	}

	private byte[] downloadUrl(String pFileUrl) throws InterruptedException, JSONException {
		ByteArrayOutputStream vResult = new ByteArrayOutputStream();
		vResult.reset();
		
		try {
			Log.d("PhoneGapLog", "Downloading " + pFileUrl);

			URL vUrl = new URL(pFileUrl);
			
			HttpURLConnection vHTTP = (HttpURLConnection) vUrl.openConnection();
			vHTTP.setRequestMethod("GET");
			if (Build.VERSION.SDK_INT < 13 /*HONEYCOMB_MR2*/) // To avoid download issue. Should be adjusted.
			  vHTTP.setDoOutput(true);
			vHTTP.connect();

			Log.d("PhoneGapLog", "Download start");
			
			InputStream vStream = vHTTP.getInputStream();			
						
			int vReaded = 0;
			byte[] buffer = new byte[1024];
			while ((vReaded = vStream.read(buffer)) > 0)				
				vResult.write(buffer, 0, vReaded);			

			buffer = null;
			Log.d("PhoneGapLog", "Download f inished");			
		}
		catch (FileNotFoundException e) {
			Log.d("PhoneGapLog", "File Not Found: " + e);
		}
		catch (IOException e) {
			Log.d("PhoneGapLog", "Error: " + e);
		}
		
		return vResult.toByteArray();
	}

	private Boolean saveToFile(File pFile, byte[] pData) throws InterruptedException, JSONException {
		try {
			FileOutputStream vOutput = new FileOutputStream(pFile); 
			vOutput.write(pData, 0, pData.length);
			vOutput.close();
		}
		catch (FileNotFoundException e) {
			Log.d("PhoneGapLog", "File Not Found: " + e);
			return false;
		}		
		catch (IOException e) {
			Log.d("PhoneGapLog", "Error: " + e);
			return false;
		}
		
		return true;
	}	
}