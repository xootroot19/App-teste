#include <jni.h>
#include <array>
#include <cstdint>
#include <sstream>
#include <string>

namespace ps2sim {
class Devkit {
 public:
  void reset(){ pc_=0x00100000; cycles_=0; gpr_.fill(0); ram_.fill(0); log_="[RESET] EE simulation initialized\n[INFO] Clean-room simulator; no Sony BIOS/SDK.\n"; }
  void step(){ ++cycles_; pc_+=4; gpr_[0]=0; std::ostringstream s; s<<"[EE] tick="<<cycles_<<" pc=0x"<<std::hex<<pc_<<"\n"; log_+=s.str(); }
  const std::string& log()const{return log_;}
 private:
  uint32_t pc_=0; uint64_t cycles_=0;
  std::array<uint64_t,32> gpr_{};
  std::array<uint8_t,2*1024*1024> ram_{};
  std::string log_;
};
static Devkit devkit;
}
extern "C" JNIEXPORT void JNICALL Java_com_xootroot_ps2devkitsim_MainActivity_nativeReset(JNIEnv*,jobject){ps2sim::devkit.reset();}
extern "C" JNIEXPORT void JNICALL Java_com_xootroot_ps2devkitsim_MainActivity_nativeStep(JNIEnv*,jobject){ps2sim::devkit.step();}
extern "C" JNIEXPORT jstring JNICALL Java_com_xootroot_ps2devkitsim_MainActivity_nativeLog(JNIEnv* e,jobject){return e->NewStringUTF(ps2sim::devkit.log().c_str());}
