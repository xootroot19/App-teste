package com.xootroot.ps2devkitsim;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.view.View;
import android.widget.*;

public class MainActivity extends Activity {
 static { System.loadLibrary("ps2devkit"); }
 private native void nativeReset();
 private native void nativeStep();
 private native String nativeLog();

 @Override public void onCreate(Bundle b) {
  super.onCreate(b);
  LinearLayout root=new LinearLayout(this);
  root.setOrientation(LinearLayout.VERTICAL);
  root.setPadding(24,24,24,24);
  root.setBackgroundColor(Color.rgb(9,11,16));

  TextView title=new TextView(this);
  title.setText("PS2 DEVKIT // CLEAN-ROOM SIM");
  title.setTextColor(Color.WHITE); title.setTextSize(20);
  root.addView(title);

  TextView status=new TextView(this);
  status.setText("EE CORE  •  DEBUG CONSOLE  •  SIMULATED RAM");
  status.setTextColor(Color.LTGRAY);
  root.addView(status);

  TextView log=new TextView(this);
  log.setTextColor(Color.rgb(120,255,160));
  log.setTextSize(14);
  ScrollView scroll=new ScrollView(this);
  scroll.addView(log);
  root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));

  LinearLayout buttons=new LinearLayout(this);
  Button reset=new Button(this); reset.setText("RESET");
  Button step=new Button(this); step.setText("STEP");
  buttons.addView(reset,new LinearLayout.LayoutParams(0,-2,1));
  buttons.addView(step,new LinearLayout.LayoutParams(0,-2,1));
  root.addView(buttons);

  reset.setOnClickListener(v->{ nativeReset(); log.setText(nativeLog()); });
  step.setOnClickListener(v->{ nativeStep(); log.setText(nativeLog()); });
  nativeReset(); log.setText(nativeLog());
  setContentView(root);
 }
}
