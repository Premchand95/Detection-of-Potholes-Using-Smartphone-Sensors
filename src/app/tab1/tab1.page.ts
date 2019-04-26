import { Component } from "@angular/core";
import { Geolocation } from "@ionic-native/geolocation/ngx";
import { HTTP, HTTPResponse } from "@ionic-native/http/ngx";
import { Sensors, TYPE_SENSOR } from "@ionic-native/sensors/ngx";
import { Device } from "@ionic-native/device/ngx";
@Component({
  selector: "app-tab1",
  templateUrl: "tab1.page.html",
  styleUrls: ["tab1.page.scss"]
})
export class Tab1Page {
  gyroscope_timer: any;
  accelration_timer: any;
  location_timer: any;
  public latitude: any;
  public longitude: any;
  public acceleration_x: number = 0;
  public acceleration_y: number = 0;
  public acceleration_z: number = 0;
  public acceleration_timestamp: any;
  constructor(
    private geolocation: Geolocation,
    private http: HTTP,
    private sensor: Sensors,
    private device: Device
  ) {}
  public btnColor: string = "success";
  public btnText: string = "Start";
  public zValue: number = 8;
  public xValue: number = 1;
  public zValueChanged(event: any): void {
    this.zValue = event.detail.value;
    console.log("z  :" + this.zValue);
  }
  public xValueChanged(event: any): void {
    this.xValue = event.detail.value;
    console.log("x  :" + this.xValue);
  }
  public startMonitoring(): void {
    if (this.btnColor === "success") {
      console.log("Started monitoring");
      this.btnColor = "danger";
      this.btnText = "Stop";
      //start monitoring acceleration
      this.sensor.enableSensor(TYPE_SENSOR.LINEAR_ACCELERATION);
      this.accelration_timer = setInterval(() => {
        this.sensor.getState().then(values => {
          console.log(values);
          this.acceleration_x = values[0];
          this.acceleration_y = values[1];
          this.acceleration_z = values[2];
          this.acceleration_timestamp = new Date(new Date().valueOf());
          this.highPassFilter();
        });
      }, 1000);
      /*
      //start monitoring gyroscope
      this.gyroscope_timer = setInterval(() => {
        this.gyroscope
          .getCurrent(options)
          .then((orientation: GyroscopeOrientation) => {
            console.log(
              orientation.x,
              orientation.y,
              orientation.z,
              orientation.timestamp
            );
          })
          .catch();
      }, 1000);
      */
      //start monitoring location
      this.location_timer = setInterval(() => {
        this.geolocation
          .getCurrentPosition()
          .then(resp => {
            this.latitude = String(resp.coords.latitude);
            this.longitude = String(resp.coords.longitude);
          })
          .catch(error => {
            console.log("Error getting location", error);
          });
      }, 1000);
    } else {
      console.log("Stopped monitoring");
      clearInterval(this.accelration_timer);
      clearInterval(this.gyroscope_timer);
      this.btnColor = "success";
      this.btnText = "Start";
    }
  }

  public highPassFilter(): void {
    //get latitude and longitude
    let eventPayload = {
      timestamp: "",
      Latitude: "",
      Longitude: "",
      x: "",
      y: "",
      z: ""
    };
    /*
    //making it 80% to remove minor changes
    this.acceleration_x = this.acceleration_x * 0.8;
    this.acceleration_y = this.acceleration_y * 0.8;
    this.acceleration_z = this.acceleration_z * 0.8;
    */
    //filter based on z- axis value
    if (this.acceleration_z >= this.zValue) {
      console.log("passed z filter");
      //filter based on x - values
      if (this.acceleration_x >= this.xValue) {
        eventPayload["x"] = String(this.acceleration_x);
        eventPayload["y"] = String(this.acceleration_y);
        eventPayload["z"] = String(this.acceleration_z);
        eventPayload["timestamp"] =
          this.device.uuid + " " + String(this.acceleration_timestamp);
        eventPayload["Latitude"] = this.latitude;
        eventPayload["Longitude"] = this.longitude;
        console.log("passed x-z filter");
        this.sendPacketToServer(eventPayload);
      }
    }
  }
  public sendPacketToServer(packet: any): void {
    console.log(packet);
    let url =
      "https://o3mx2zr7jg.execute-api.us-east-1.amazonaws.com/postpothole/postpothole";
    this.http.setDataSerializer("json");
    let headers = { Accept: "application/json" };
    this.http.post(url, packet, headers).then((value: HTTPResponse) => {
      console.log(value);
    });
  }
}
