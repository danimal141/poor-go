declare i32 @printf(i8* nocapture readonly, ...)

@.str = private unnamed_addr constant [2 x i8] c"%s\00", align 1

@.str.0 = private unnamed_addr constant [12 x i8] c"hello world\00", align 1

define i32 @main() {

entry:

  %1 = getelementptr [2 x i8], [2 x i8]* @.str, i64 0, i64 0
  %0 = getelementptr [8 x i8], [8 x i8]* @.str.0, i64 0, i64 0
  %2 = call i32 (i8*, ...) @printf(i8* %1, i8* %0)
  ret i32 0

}
