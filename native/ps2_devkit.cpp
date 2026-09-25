#include <array>
#include <cstdint>
#include <sstream>
#include <string>

// Clean-room educational simulation of selected publicly documented PS2 concepts.
// No Sony BIOS, SDK, ROM, keys, firmware or proprietary code is included.
namespace ps2sim {
class Devkit {
 public:
  void reset() {
    pc_ = 0x00100000;
    cycles_ = 0;
    gpr_.fill(0);
    ram_.fill(0);
    log_ = "[RESET] EE simulation initialized\n";
  }
  void step() {
    // Demonstration instruction tick, not a cycle-accurate PS2 emulator.
    ++cycles_;
    pc_ += 4;
    gpr_[0] = 0;
    std::ostringstream s;
    s << "[EE] tick=" << cycles_ << " pc=0x" << std::hex << pc_ << "\n";
    log_ += s.str();
  }
  const std::string& log() const { return log_; }
 private:
  uint32_t pc_ = 0;
  uint64_t cycles_ = 0;
  std::array<uint64_t, 32> gpr_{};
  std::array<uint8_t, 2 * 1024 * 1024> ram_{}; // sandbox RAM for simulator UI
  std::string log_;
};
}
extern "C" {
static ps2sim::Devkit g_devkit;
void ps2dev_reset() { g_devkit.reset(); }
void ps2dev_step() { g_devkit.step(); }
const char* ps2dev_log() { return g_devkit.log().c_str(); }
}
