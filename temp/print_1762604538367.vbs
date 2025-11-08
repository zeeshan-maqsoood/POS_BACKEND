
                Set objNetwork = CreateObject("WScript.Network")
                Set objShell = CreateObject("WScript.Shell")
                
                ' Get the default printer
                strDefaultPrinter = "HP LaserJet P1005"
                
                ' Check if the printer exists
                On Error Resume Next
                Set objPrinter = objNetwork.EnumPrinterConnections()
                printerFound = False
                
                For i = 0 To objPrinter.Count - 1 Step 2
                    If LCase(objPrinter(i + 1)) = LCase(strDefaultPrinter) Then
                        printerFound = True
                        Exit For
                    End If
                Next
                
                If Not printerFound Then
                    WScript.Echo "ERROR: Printer not found: " & strDefaultPrinter
                    WScript.Quit 1
                End If
                
                ' Set as default printer temporarily
                strCurrentPrinter = objNetwork.PrinterDefault
                objNetwork.SetDefaultPrinter strDefaultPrinter
                
                ' Print the file
                Set objShellApp = CreateObject("Shell.Application")
                objShellApp.ShellExecute "msprint", "E:\\SourceFind - Copy\\Backend\\temp\\receipt_1762604538365.txt", "", "open", 1
                
                ' Wait a moment for the print job to be sent
                WScript.Sleep 3000
                
                ' Restore the original default printer
                objNetwork.SetDefaultPrinter strCurrentPrinter
                
                WScript.Echo "Print job submitted successfully"
                WScript.Quit 0
                