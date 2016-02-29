package models

import play.api.libs.json._
import play.api.libs.functional.syntax._

case class BvtResult(
    name: String,
    build: String,
    passed: Int,
    failed: Int,
    notExecuted: Int,
    nodeId: String,
    duration: Long) {
}

object BvtResult {
  val writes: Writes[BvtResult] = (
    (JsPath \ "name").write[String] and
    (JsPath \ "build").write[String] and
    (JsPath \ "passed").write[Int] and
    (JsPath \ "failed").write[Int] and
    (JsPath \ "notExecuted").write[Int] and
    (JsPath \ "nodeId").write[String] and
    (JsPath \ "duration").write[Long])(unlift(BvtResult.unapply))
}

case class RunConfig(name: String)
abstract case class RunGroup(name: String) {
  def all: List[RunConfig]
}

object RunConfig {
  object Native extends RunGroup("Native") {
    val Stable = RunConfig("BVT - Win10 B - x64")
    val Unstable = RunConfig("BVT - Win10 A - x64")
    val Stw = RunConfig("BVT - STW - Win10 - x64")
    val IE = RunConfig("BVT - Win10  IE - x64")
    val iOS = RunConfig("BVT - iOS native - iPhone Device")
    
    val Android = RunConfig("BVT - Android native - Remote Android Device")

    val all = List(Stable, Unstable, Stw, IE, iOS, Android)
  }

  object Web extends RunGroup("Web") {
    val Edge = RunConfig("BVT - Win10 Edge - x64")
    val Firefox = RunConfig("BVT - Win10  FF - x64")
    val Safari = RunConfig("BVT - iOS - Safari - iPad Air")
    val SafariRemote = RunConfig("BVT - Safari (Remote)")
    val Chrome = RunConfig("BVT - Win10  Chrome - x64")
    val ChromeMobile = RunConfig("BVT - Android - Chrome - Nexus")

    val all = List(Edge, Firefox, Safari, SafariRemote, Chrome, ChromeMobile)
  }

  val all = Native.all ++ Web.all
  val allGroups = List(Native, Web)
}