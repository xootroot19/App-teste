# PS2 Devkit Simulator (clean-room prototype)

Android/C++ prototype for an educational **simulation** of a PS2-style development/debug environment.

## Current native core
- C++20 core built with CMake/Android NDK
- simulated EE register bank and program counter
- isolated simulator RAM
- reset / single-step operations
- textual debug log API

This is **not** an official Sony devkit and is not claimed to be cycle-accurate. It contains no PlayStation 2 BIOS, Sony SDK, ROM, firmware, cryptographic keys, or proprietary Sony source code.

## Build direction
The native library target is `ps2devkit`. An Android UI/JNI layer can call `ps2dev_reset`, `ps2dev_step`, and `ps2dev_log` and present a debugger-style interface.

The project is intended for clean-room experimentation based on publicly documented hardware concepts.
