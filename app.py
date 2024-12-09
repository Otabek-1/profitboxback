n=int(input())
s=1
i=0 # 0 ishtirok etmagan son
while i<n:
  if not "0" in str(s):
    s+=1
  else:
    i+=1
    s+=1
print(s)