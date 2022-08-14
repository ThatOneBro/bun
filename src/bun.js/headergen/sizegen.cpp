#include <ctime>
#include <fstream>
#include <iostream>
using namespace std;

#include "root.h"

#include "ZigGlobalObject.h"

#include "Path.h"

#include "DOMURL.h"

#include "headers-cpp.h"

#include "JavaScriptCore/CallFrame.h"
#include "JavaScriptCore/JSArrayBufferViewInlines.h"

int main() {
  time_t rawtime;
  struct tm *timeinfo;
  char buf[80];

  time(&rawtime);
  timeinfo = localtime(&rawtime);

  strftime(buf, 80, "%Y-%m-%d %H:%M:%s", timeinfo);

  cout << "// Auto-generated by src/bun.js/headergen/sizegen.cpp at " << buf
       << ".\n";
  cout << "// These are the byte sizes for the different object types with "
          "bindings in JavaScriptCore.\n";
  cout << "// This allows us to safely return stack allocated C++ types to "
          "Zig.\n";
  cout << "// It is only safe to do this when these sizes are correct.\n";
  cout << "// That means:\n";
  cout << "// 1. We can't dynamically link JavaScriptCore\n";
  cout << "// 2. It's important that this is run whenever JavaScriptCore is "
          "updated or the bindings on the Zig side change.\n";
  cout << "//    Failure to do so will lead to undefined behavior and probably "
          "some frustrated people.\n";
  cout << "// --- Regenerate this: --- \n";
  cout << "// 1. \"make headers\"\n";
  cout << "// 2. \"make sizegen\"\n";
  cout << "// 3. \"make headers\"\n";
  cout << "// ------------------------\n";
  cout << "// You can verify the numbers written in this file at runtime via "
          "the `extern`d types\n";
  cout << "// Run \"headers\" twice because it uses these values "
          "in the output. That's how all the bJSC__.* types are created - from "
          "these values. \n";
  int i = 0;
  int len = 31;
  for (i = 0; i < len; i++) {
    cout << "pub const " << names[i] << " = " << sizes[i] << ";\n";
    cout << "pub const " << names[i] << "_align = " << aligns[i] << ";\n";
  }
  cout << "pub const Bun_FFI_PointerOffsetToArgumentsList = "
       << JSC::CallFrame::argumentOffset(0) << ";\n";
  cout << "pub const Bun_FFI_PointerOffsetToTypedArrayVector = "
       << JSC::JSArrayBufferView::offsetOfVector() << ";\n";
  return 0;
}