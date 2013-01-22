jQuery(function( $ ){
    function preLoad() {
        //$("#content").addClass("hidden");
        $('body').css('visibility','hidden');
    }

    function loaded() {
        //$("#content").removeClass("hidden");
        $('body').css('visibility','');
        $('div#preLoader').css({display:'none'}).remove();
    }

    preLoad();
    window.onload=loaded;
});
				
$(document).ready(function(){

//{{{ //VARIAVEIS INICIAIS

		transicao_passo = false; //para controle do efeito (fade-in, etc) na transição entre os passos
		transicao_subtopico = false; //para controle da rolagem automática da tela (.scrollToMe()) na transição entre os subtópicos

		// lê parâmetro passado via querystring - url da barra de endereços
		var querystring = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&').toString();

		// obtem o id da interação inicial a partir do parâmetro passado via URL 
		if(querystring.indexOf("interacao") >= 0){ 
			//index_interacao = $(".interacao[name='"+querystring.split("=")[1].split("#")[0]+"']").attr("id").split("interacao")[1];
			index_interacao = $('.interacao>.meta>.rotulo').filter(function(){  
																return $(this).text() == querystring.split("=")[1].split("#")[0]; 
														   })
												
														   .parents(".interacao").attr("id").split("interacao")[1];
		}	
		// (se nada for passado, começa da primeira interação)
		else {
			index_interacao = $(".interacao:first").attr("id").split("interacao")[1];
		}
			
		// cria variáveis e obtem índices do passo, modulo, topico, subtopico
		index_passo = 0;
		index_modulo = 0;
		index_topico = 0;
		index_subtopico = 0;
		atualizaIndices();
		
		// remove tags img para fazer preload das imagens posteriormente
		removeImagens();
		
		// inicializa as demonstrações
		inicializaDemonstracoes();
//}}}

});	

//{{{ //FUNÇÕES

		//{{{ NAVEGAÇÃO
			
			//{{{  NAVEGACAO POR TECLADO
			function navegacaoTeclado(){
				// 'keydown' porque são teclas especiais
				$(document).keydown(function(e) {
						// seta para a direita - vai para próxima interação
						if(e.keyCode == 39) {
							avancaInteracao();
						}
						// seta para a esquerda - vai para a interação anterior
						if(e.keyCode == 37) {
							voltaInteracao();
						}	
				});
			}
			//}}}	
			
			//{{{  NAVEGACAO ENTRE OS SUBTÓPICOS/demonstrações
			function navegacaoSubtopicos(){
				// ativa o tooltip nos itens do menu_subtopico
				ativaTooltip();
				
				// Evento click nos links do menu_subtopico
				$(document).off("click", ".navegacao_subtopicos .menu_subtopico .link_subtopico, .navegacao_subtopicos .menu_subtopico .link_subtopico_destaque");
				$(document).on("click", ".navegacao_subtopicos .menu_subtopico .link_subtopico, .navegacao_subtopicos .menu_subtopico .link_subtopico_destaque", function(){		
					transicao_subtopico = true;
					index_interacao = $('#sub'+$(this).attr('name')+' .interacao:first').attr('id').split('interacao')[1];
					atualizaIndices();
					exibeInteracao();
					inicioDemonstracao();
					atualizaNavegacao();
				});
				
			}
			//}}}
			
			//{{{  NAVEGACAO INTERAÇÕES
			//navegação dos botões anterior/próximo que ficam dentro da caixa de texto (informação+instrução) da interação
			function navegacaoInteracoes(){
				// vai para o próxima interação
				$(document).on("click",".hit_proximo",function(e) {

					avancaInteracao();	
				});	
				// vai para a interação anterior
				$(document).on("click",".hit_anterior",function(e) { 
					voltaInteracao();
				});
				
				//ativa evento de click no link_subtopico 
				//(o off é para que não fique com mais de um 'on' quando adiciona/exclui passo)
				$(document).off("click", ".navegacao_interacoes .paginacao .link_interacao");
				$(document).on("click", ".navegacao_interacoes .paginacao .link_interacao", function(){	
					index_interacao = $(this).attr('name');
					atualizaIndices();
					transicao_subtopico = true;
					exibeInteracao();
					atualizaNavegacaoInteracoes();
				});
			
				ativaTooltip();
			}
			//função que controla a navegação pelas interações através de números (possibilita navegação não linear)
			//OBS.: default -> visível apenas na visão professor. Para ativar na visão aluno, alterar classe .navegacao_interacoes no CSS
			function atualizaNavegacaoInteracoes(){
				$('.navegacao_interacoes .paginacao .link_interacao[name="'+index_interacao+'"]').siblings().removeClass('destaque');
				$('.navegacao_interacoes .paginacao .link_interacao[name="'+index_interacao+'"]').addClass('destaque');	

				//EVENTOS
				// vai para a próxima tela
				$(document).off("click", ".proximo");
				$(document).on("click",".proximo",function(e) {  

					avancaInteracao();
					atualizaNavegacaoInteracoes();
				});	
				// vai para a tela anterior
				$(document).off("click", ".anterior");
				$(document).on("click",".anterior",function(e) {  
					voltaInteracao();
					atualizaNavegacaoInteracoes();
				});						
			}
			//}}}
			
			//{{{ ATUALIZA NAVEGACAO 			
			// destaca subtopico atual no menu de navegacao subtopico (.navegacao_subtopico)
			function atualizaNavegacao(){
				$(".navegacao_subtopico .paginacao a:not(.anterior, .proximo)").attr("class", "link_subtopico");
				$(".navegacao_subtopico .paginacao a[name='"+index_interacao+"']").attr("class", "link_subtopico_destaque");
				// destaca subtopico atual na navegação global
				$(".navegacao_subtopicos .menu_subtopico .paginacao a").attr("class", "link_subtopico");
				$(".navegacao_subtopicos .menu_subtopico .paginacao a[name='"+index_subtopico+"']").attr("class", "link_subtopico_destaque");
			}
			//}}}
			
			//{{{ ACERTO HIT 
			
			//função para acerto do hit pelo aluno
			function acertaHit() {
				
				
		    			
		    			
				$('.hit').off("click");
				$('.hit').on({
	
						
					click: function(event){
 	
						avancaInteracao();
					}
				});
			}
			
			
			
			
			//}}}
			
			//{{{ TELAS DE INÍCIO E FIM DA DEMONSTRAÇÃO
			
			// função que cria uma camada no primeiro passo da demonstração para o início dela
			function inicioDemonstracao() {
				if(!$("#interacao"+index_interacao+" .efeito_mascara_inicio").length){
					$("#interacao"+index_interacao).append("<div class='efeito_mascara_inicio'></div>")
												   .append("<input type='button' value='Iniciar demonstração' class='botao_iniciar_demo' name='iniciar'/>")
												   //trecho comentado: localização no sistema
												   /*.append("<div class='localizacao_sistema'>Para encontrar esta funcionalidade no <strong><em>menu do sistema</em></strong>, passe o mouse sobre <strong><em>Cadastro</em></strong> e clique em <strong><em>Ação Educacional</em></strong>.</div>")*/;
				}
				
				//se IE6 ou anteriores, força altura da div .efeito_mascara_inicio para cobrir toda a imagem
				//obs: nos outros navegadores funciona com o "height:100%;" do css
				if(($.browser.msie) && ($.browser.version <= 6)){
					$(".efeito_mascara_inicio").css("height",$("#interacao"+index_interacao).height());
				}
				
				$(".efeito_mascara_inicio").css({opacity:0.78})
										   .fadeIn("fast");
			}
			
			// função que sinaliza o fim da demonstração para o usuário após clicar no último hit
			function fimDemonstracao() {
				if(!$("#interacao"+index_interacao+" .efeito_mascara_fim").length){
					$("#interacao"+index_interacao).append("<div class='efeito_mascara_fim'></div>")
																	   .append("<div class='texto_fim_demo'>Fim da demonstração<br/><input type='button' value='Voltar para a última etapa' class='botao_ultima_etapa' name='rever'/>&nbsp;&nbsp;<input type='button' value='Rever desde o início' class='botao_rever_demo' name='rever'/></div>");
				}
				
				$(".efeito_mascara_fim").css({opacity:0.8})
										.css("height",$("#interacao"+index_interacao).height())
										.fadeIn("fast");
				$(".texto_fim_demo").scrollToMe();
				
				//chama a função para remover a tela de fim de demo ao clicar no efeito mascara ou pressionar ESC
				$(document).off("click", ".efeito_mascara_fim");
				$(document).on("click", ".efeito_mascara_fim", function(e){		
					zeraFimDemonstracao();
				});
				$(document).keypress(function(e) {
					if(e.keyCode == 27) {	
						zeraFimDemonstracao();
					}
				});
			}
			
			//função para remover a tela de fim de demo ao clicar na div do efeito mascara ou pressionar ESC
			function zeraFimDemonstracao(){
				$("#interacao"+index_interacao+ " .efeito_mascara_fim").fadeOut("fast", function(){ $(this).remove(); });
				$("#interacao"+index_interacao+ " .texto_fim_demo").fadeOut("fast", function(){ $(this).remove(); });
				
				//exibe última interação da demonstração
				exibeInteracao();
			}
			
			//botão iniciar demo
			$(document).on("click", ".botao_iniciar_demo", function(){
				//remove botão e máscara

				$(this).remove();
				$("#interacao"+index_interacao+" .efeito_mascara_inicio").fadeOut("fast", function(){ $(this).remove(); });
				
				//exibe primeira interação
				exibeInteracao();
				
				// aplica efeito no hit: se for do tipo borda, o hit pisca
				if($("#interacao"+index_interacao+" .hit").hasClass("borda")) { 
					$("#interacao"+index_interacao+" .hit").effect("pulsate",{mode:"show"}); // Efeito 'pulsate' - jQuery UI
				}	
			});	
			
			//botão rever demo
			$(document).on("click", ".botao_rever_demo", function(){
				$(this).parent().remove();
				$("#interacao"+index_interacao+" .efeito_mascara_fim").remove();
				index_interacao = $("#sub"+index_subtopico+" .interacao:first").attr("id").split("interacao")[1];
				atualizaIndices();
				exibeInteracao();
				inicioDemonstracao();
			});	
			
			//botão voltar para a última etapa
			$(document).on("click", ".botao_ultima_etapa", function(){
				zeraFimDemonstracao();
			});	
			
			//botão voltar para a o índice
			$(document).on("click", ".botao_voltar_para_indice", function(){
				window.location = $('.breadcrumb .first a').attr('href');
			});	
			
			//}}}
			
			//{{{ BOTÃO SEGUIR - nas caixas de texto dos destaques do tipo mascara
			$(document).on("click", ".botao_seguir", function(){

				avancaInteracao();
			});
			//}}}			
			
		//}}}
		
		
		//{{{ INTERAÇÕES
		
			// obtem índices do passo, modulo, topico, subtopico a partir do index_interacao
			function atualizaIndices(){
				//checa se houve transição entre passos
				if(index_passo != $("#interacao"+index_interacao).parents().filter(".passo").attr("id").split("passo")[1]){
					transicao_passo = true;
				}
				else {
					transicao_passo = false;
				}
				//obtem índices a partir do index_interacao
				index_passo = $("#interacao"+index_interacao).parents().filter(".passo").attr("id").split("passo")[1];
				index_modulo = $("#passo"+index_passo).parents().filter(".modulo").attr("id").split("mod")[1];
				index_topico = $("#passo"+index_passo).parents().filter(".topico").attr("id").split("top")[1];
				index_subtopico = $("#passo"+index_passo).parents().filter(".subtopico").attr("id").split("sub")[1];
				//alert("mod"+index_modulo+" top"+index_topico+" sub"+index_subtopico+" passo"+index_passo+" interacao"+index_interacao);
			}
			
			// função para avançar para a próxima interação
			function avancaInteracao() {
				//variáveis para checar se é a última interação da demonstração
				var etapa_atual = $('#passo'+index_passo+'_texto'+index_interacao+' .hit_etapa').text().split(' ')[1];
				var ultima_etapa = $('#passo'+index_passo+'_texto'+index_interacao+' .hit_etapa').text().split(' ')[3].split(')')[0];
				
				// se a tela de início da demonstração estiver sendo exibida, oculta tela e mostra primeira interacao
				if($("#interacao"+index_interacao+" .efeito_mascara_inicio").length){
					$('#interacao'+index_interacao+' .botao_iniciar_demo').remove();
					$('#interacao'+index_interacao+' .efeito_mascara_inicio').fadeOut('fast', function(){ $(this).remove(); });
					exibeInteracao();
				}
				// se não, exibe a próxima interação se ela existir
				else if($('#sub'+index_subtopico+' #interacao'+(parseInt(index_interacao,10)+1)).length){
					index_interacao++;
					atualizaIndices();
					exibeInteracao();
				}
				//se for a última interação da demonstração, exibe tela de fim da demo
				else if(etapa_atual == ultima_etapa) {
					fimDemonstracao();
				}
			}
			
			// função para voltar para a interação anterior
			function voltaInteracao() {
				//se estiver na tela de fim de demonstração, oculta tela e mostra última interação da demo
				if($("#interacao"+index_interacao+" .efeito_mascara_fim").length){
					zeraFimDemonstracao();
				}				
				// se não, exibe a interação anterior se ela existir
				else if($('#sub'+index_subtopico+' #interacao'+(parseInt(index_interacao,10)-1)).length){
					index_interacao--;
					atualizaIndices();
					exibeInteracao();
				}
				//se estiver na primeira interação, exibe tela de início da demonstração
				else if($('#sub'+index_subtopico+' .interacao').index($('#interacao'+index_interacao)) == 0){
					inicioDemonstracao();
				}
			}
			
			// exibe a interação: imagem, hit e caixa de texto
			function exibeInteracao(){
				
				//esconde modulos, topicos, subtopicos, passos e interacoes
				//obs: se modulo, topico, subtopico e passo continuam os mesmos, não os esconde (seletor :not)
				$(".modulo:not(#mod"+index_modulo+")").hide();
				$(".topico:not(#top"+index_topico+")").hide();
				$(".subtopico:not(#sub"+index_subtopico+")").hide();
				$(".passo:not(#passo"+index_passo+")").hide();
				$(".interacao").hide();
					
				//exibe os novos: modulo, topico, subtopico, passo e interacao
				$("#interacao"+index_interacao).show();
				$("#passo"+index_passo).show();
				$("#sub"+index_subtopico).show();
				$("#top"+index_topico).show();
				$("#mod"+index_modulo).show();
				
				//se houve transição de passo, exibe com efeito fade-in
				//OBS.: implementar futuramente, por enquanto está exibindo sem o fade
				/*
				if(transicao_passo){
					//$("#passo"+index_passo).css({opacity:0}).show().animate({opacity:1}, 'normal');
					$("#passo"+index_passo).show();
				}
				//se não, exibe sem efeito
				else {				
					$("#passo"+index_passo).show();
				}	
				*/				
				
				//rola tela para a caixa de texto (informação+instrução) se não for uma transição entre subtópicos/demonstrações
				if(!transicao_subtopico){
					$("#passo"+index_passo+"_texto"+index_interacao).scrollToMe();
					
				}
				//se for, manda a tela para o topo e exibe novo subtópico
				else {
					//carrega as imagens da demonstração
					carregaImagens();
					//rola para o topo da página
					$('html,body').scrollTop(0);
					//exibe novo subtopico com efeito fade-in
					$("#sub"+index_subtopico).css({opacity:0}).show().animate({opacity:1}, 'normal');
					//reseta valor da variável se for uma transição entre subtópicos/demonstrações
					transicao_subtopico = false;
				}
			
				//exibe o hit
				exibeHit($('#interacao'+index_interacao+' .hit'));
			}
			
			// atualiza número da etapa correspondente à interação, na caixa de texto ("Etapa XX de YY")
			function defineNumerosEtapas() {
				$('.subtopico').each(function(){
					$(this).find('.interacao').each(function(i){
						var id_passo =  $(this).parents().filter(".passo").attr("id").split("passo")[1];
						var id_interacao = $(this).attr("id").split("interacao")[1];
						var etapa = $('#passo'+id_passo+'_texto'+id_interacao+' .hit_etapa');
						etapa.text(etapa.text().replace('xx', i+1));
					});
				});
			}
			
			// função que posiciona a seta em relação à caixa do texto
			function posicionaSetas(){
				//Para acessar propriedades CSS de elementos, como altura e lagura, eles (e seus parents), devem estar visíveis.
				//Portanto, antes de posicionar as setas, as divs interacao, passo, subtopico, topico e modulo são 
				//ocultadas (visibity:hidden), porém o espaço ocupado por elas continua visível (display:block).
				//(obs: são declaradas variáveis porque, ao final da função, o CSS das divs é resetado para o valor original)
				var interacoes = $('.interacao:hidden').css({'visibility':'hidden','display':'block'});
				var passos = $('.passo:hidden').css({'visibility':'hidden','display':'block'});
				var subtopicos = $('.subtopico:hidden').css({'visibility':'hidden','display':'block'});
				var topicos = $('.topico:hidden').css({'visibility':'hidden','display':'block'});
				var modulos = $('.modulo:hidden').css({'visibility':'hidden','display':'block'});
				interacoes.css({'visibility':'hidden','display':'block'});
				passos.css({'visibility':'hidden','display':'block'});
				subtopicos.css({'visibility':'hidden','display':'block'});
				topicos.css({'visibility':'hidden','display':'block'});
				modulos.css({'visibility':'hidden','display':'block'});
					
				//Loop para posicionar as setas	(apenas no tópico atual)
				$('#top'+index_topico+' .hit_seta').each(function(){	
					
					var seta = $(this);
					var top = seta.attr('style').split('top: ')[1].split('px')[0];
					var left = seta.attr('style').split('left: ')[1].split('px')[0];
					var caixa_texto = seta.parent();					
					
					//Se caixa de texto fica acima do hit, corrige posição da seta e da caixa de texto
					if (top > caixa_texto.height() && (left > 0 && left < 324)) { 
						top = caixa_texto.outerHeight() -
							  caixa_texto.css('borderBottomWidth').split('px')[0] - 
							  caixa_texto.css('borderTopWidth').split('px')[0];	
						caixa_texto.css('top', parseInt(caixa_texto.siblings('.hit').attr('style').split('top:')[1].split('px')[0],10) - caixa_texto.outerHeight() - 20);
						seta.css('top', top);
					}
					
					//top: seta acima da caixa de texto
					if(top < 0) {
						seta.css("background-position", "left -32px");
					}
					//right: seta à direita da caixa de texto
					else if(left > caixa_texto.width()) {
						seta.css("background-position", "left -16px");
					}
					//bottom: seta abaixo da caixa de texto
					else if(top >= caixa_texto.innerHeight()){
						seta.css("background-position", "left -48px");
					}
					//left: seta à esquerda da caixa de texto
					else if(left <= 0) {
						seta.css("background-position", "left top");
					}					
				});
				
				//Reseta CSS das divs interacao, passo, subtopico, topico e modulo, alterado no início da função 
				interacoes.css({'visibility':'','display':'none'});
				passos.css({'visibility':'','display':'none'});
				subtopicos.css({'visibility':'','display':'none'});
				topicos.css({'visibility':'','display':'none'});
				modulos.css({'visibility':'','display':'none'});				
			}
		
		//}}}	
				
		//{{{ INICIALIZA A DEMONSTRAÇÃO
		function inicializaDemonstracoes(){
			
			// ativa funções de navegação
			navegacaoInteracoes();
			navegacaoSubtopicos();
			navegacaoTeclado();				
			
			// se for o primeiro passo da demonstração, cria layer de início da demo
			if($("#passo"+index_passo+">.meta>.ordem").text() == 1) {
				inicioDemonstracao();
			}
			
			// atualiza número da etapa correspondente à interação, na caixa de texto ("Etapa XX de YY")
			defineNumerosEtapas();
			
			//exibe a primeira interação
			//obs: transicao_subtopico é setada com true para evitar rolagem para o primeiro hit
			transicao_subtopico = true;	
			exibeInteracao();
			
			//destaca subtopico atual no menu de navegacao dos subtopicos (.navegacao_subtopico)
			atualizaNavegacao();
			
			// inicializa o glossário
			glossario();
			
			// posiciona a seta em relação à caixa do texto
			posicionaSetas();
			
			// desabilita links com href=# para não irem ao topo da página
			$(document).on("click", "a[href='#']", function(event) {
			   event.preventDefault();
			});
			
			//inicializa hits
			acertaHit();
			
			//carrega as imagens da demonstração
			//carregaImagens();
		}
		//}}}		
		
		//{{{ LINK PARA A PRÓXIMA AÇÃO / SUBTÓPICO 
		
		//ativa evento de click no link_proxima_acao - exibe o próximo subtópico
		$(document).on("click", ".link_proxima_acao", function(){
			transicao_subtopico = true;		
			index_interacao = $(this).attr('name');
			atualizaIndices();
			atualizaNavegacao();
			exibeInteracao();
			inicioDemonstracao();
		});
		
		//}}}		
		
		//{{{ EXIBE HITS				
			
		//função que exibe o hit
		function exibeHit(hit){
			// se o hit não é do tipo mascara, exibe o hit
			if(hit.hasClass("borda")) { 
					
				// se não estiver na tela de início da demonstração, exibe hit com efeito
				if ($('#interacao'+index_interacao+' .efeito_mascara_inicio').length) {
					hit.show();
				}
				else {
					hit.effect("pulsate",{mode:"show"}); // Efeito 'pulsate' - jQuery UI
				}
			}
			// se o hit for do mascara, deixa borda do hit transparente e exibe texto
			else if (hit.hasClass("mascara")){ 
				hit.show()
				   .css("border","transparent")
				   .css("cursor","auto");
				   
				efeitoMascara(hit);
					
				//desabilita clique no hit do tipo máscara
				hit.off("click");
			}
			// se o hit for do informação, deixa borda do hit transparente,exibe texto em caixa centralizada e oculta seta
			else if (hit.hasClass("informacao")){ 
				hit.show()
				   .css("border","transparent")
				   .css("cursor","auto");
				   
				$('#passo'+index_passo+"_texto"+index_interacao+' .hit_seta').hide();   
				
				efeitoMascara(hit);
					
				//desabilita clique no hit do tipo máscara
				hit.off("click");
			}
		}	
		//}}}	
		
		//{{{ EFEITO MASCARA 
		//adiciona o div que cobre a tela para efeito 'informacao'
		function efeitoMascara(hit){ 
			
			//adiciona divs .efeito_mascara se elas ainda não tiverem sido adicionadas
			if(!$('#interacao'+index_interacao+' .efeito_mascara').length){
				$('#interacao'+index_interacao).append("<div class='efeito_mascara'></div><div class='efeito_mascara'></div><div class='efeito_mascara'></div><div class='efeito_mascara'></div>");
				$('.efeito_mascara').css({opacity:0.5});
			}	
						
			// posiciona e redimensiona cada parte do efeito_mascara, deixando uma "janela" na região do hit
			// ordem -> 0: topo, 1: base, 2: esquerda, 3: direita
			$('#interacao'+index_interacao+' .efeito_mascara').eq(0).css("width",$("#interacao"+index_interacao).width()+"px")
																	.css("height",hit.position().top)
																	.css("top","0px");
			$('#interacao'+index_interacao+' .efeito_mascara').eq(1).css("width",$("#interacao"+index_interacao).width()+"px")
																	.css("height",$("#interacao"+index_interacao).height() - hit.position().top - hit.height() - 7)
									  								.css("top",hit.position().top + hit.height() + 6);
			$('#interacao'+index_interacao+' .efeito_mascara').eq(2).css("width",hit.position().left)
									  								.css("height",hit.height() + 6)
									  								.css("top",hit.position().top);
			$('#interacao'+index_interacao+' .efeito_mascara').eq(3).css("width",$("#interacao"+index_interacao).width() - hit.position().left - hit.width() -6)
									  								.css("height",hit.height() + 6)
									  								.css("top",hit.position().top)
									  								.css("left",hit.position().left + hit.width() + 6);
			// exibe o efeito_mascara
			$(".efeito_mascara").show();
		}
		
		//}}}
		
		
		//{{{ PRELOAD IMAGENS
		//remove tags img (para carregar imagens posteriormente) e adiciona div "loading"
		//obs: adiciona div "url_img" para armazenar a URL das imagens
		function removeImagens(){ 			
			$('.interacao img').each(function(){
				$(this).before('<div class="loading" style="height:'+$(this).height()+'px"></div><span class="url_img">'+$(this).attr('src')+'</span>');
				$(this).remove();		
			});			
		}
		//carrega imagens e remove divs "loading"
		function carregaImagens(){ 	
			//se imagens ainda não tiverem sido carregadas, executa loop para cada div "url_img"
			if($('#sub'+index_subtopico+' .url_img').length) {
				$('#sub'+index_subtopico+' .url_img').each(function(){
					//variáveis
					var div_url_img = $(this);
					var url_img = div_url_img.text();
					var img = new Image();
					
					//adiciona imagem
					div_url_img.before(img);
					//oculta a imagem
					$(img).hide();
					
					//declara função que será executada após o carregamento da imagem
					$(img).load(function(){
						//remove div "loading" e "url_img"
						div_url_img.siblings('.loading').remove();
						div_url_img.remove();
						//exibe imagem carregada com efeito fade-in
						$(img).fadeIn();
					}).attr('src',url_img).attr("class","print_tela");
				});
				
			}
		}
		//}}}
		
		
		//{{{ GLOSSARIO
		
		// função que ativa o glossário
		// obs: utiliza o plugin Highlight Text
		function glossario() {
			$(".glossario dl").each(function(){
				var linha = $(this);
				var termo = linha.children("dt").text();
				var significado = linha.children("dd").html();
				
				//$(".coordenada").highlightText(termo,"link_glossario termo",true);
				$(".descricao_acao .apresentacao").highlightText(termo,"link_glossario linha"+linha.index(), true);
				if(!$(".descricao_acao .apresentacao .linha"+linha.index()).length){
					$(".descricao_acao .importante").highlightText(termo,"link_glossario linha"+linha.index(), true);
				}	
				$(".link_glossario").attr("href","#")
				$(".linha"+linha.index()).attr("title","<strong>"+termo+":</strong><br/>"+significado);
			});
			$(".link_glossario").tipTip({maxWidth: "350px", edgeOffset: 2, defaultPosition: "top"});
		}
		
		//}}}
				
		//{{{ ATIVA TOOLTIP
		function ativaTooltip(){
				$(".navegacao_subtopicos a").tipTip({maxWidth: "350px", edgeOffset: 6, defaultPosition: "top"});
				$(".breadcrumb .first a").tipTip({maxWidth: "350px", edgeOffset: 3, defaultPosition: "top"});				
		}
		//}}}		
		
//FIM DE FUNÇÕES }}}
		
		
//{{{ INICIO PLUGIN E-HELP ('Como navegar na demonstração')
	$.getJSON("../js/paths.json",
		function(paths) {
			$('.EHhelpBox').embeddedHelp(paths, {
			'animatedvp': true,
			'staticvp': true,
			'autoalign':false,
			'callextf':true,
		    'autolinks':false			
	     	});
		});
		
	$.ativaProximoDestaque = function(obj) { 
		proximo = obj.value;
		$.getJSON("../js/paths.json",
			function(paths) {
				$('#'+proximo).embeddedHelp(paths, {
				'animatedvp': true,
				'staticvp': true,
				'autoalign':false,
				'callextf':true,
				'autolinks':false		
			});
			//interrompe animação do hit de rolagem da tela	
			$('html,body').stop(true, true);	
		});
		return false;
	}
	//volta para o início da demo para mostrar o botão 'Iniciar demonstração'
	$(document).on("mouseup","#EHhelpBoxDemo2 a",function(){
		index_interacao = $("#sub"+index_subtopico+" .interacao:first").attr("id").split("interacao")[1];
		atualizaIndices();
		exibeInteracao();
		inicioDemonstracao();
	});
	//simula clique no botão 'Iniciar demonstração'
	/*$(document).on("mouseup","#EHhelpBoxDemo5 a",function(){
		$("#interacao"+index_interacao+" .botao_iniciar_demo").remove();
		$("#interacao"+index_interacao+" .efeito_mascara_inicio").fadeOut("fast", function(){ $(this).remove(); });
	});*/
	//termina help
	$(document).on("mouseup","#fecha_ehelp",function(){
		$('#EHtooltip').fadeOut("slow", $('#EHtooltip').remove());
		$('#EHpointer').fadeOut("slow", $('#EHpointer').remove());
		$('.EHmarker').removeClass('EHmarker');
	});
	/*$.terminaAjuda = function(obj) {
		$('#EHtooltip').fadeOut("slow", $('#EHtooltip').remove());
		$('#EHpointer').fadeOut("slow", $('#EHpointer').remove());
		$('.EHmarker').removeClass('EHmarker');
	}*/
//FIM PLUGIN E-HELP }}}	



//{{{ PLUGIN SCROLLTOME
// função que rola a tela para o item
$.fn.extend({
scrollToMe: function () {
	//variáveis
	var dominio_demonstracao = window.location.href.split('/')[2].toString();
	var dominio_janela_pai = window.parent.location.href.split('/')[2].toString();
	
	if(dominio_demonstracao == dominio_janela_pai) {
		//para rolar a página do curso no moodle - demo inserida via iframe
		if(window.parent.$("iframe").length){
			//alert(index_iframe);
			
			index_iframe = "#iddemo"+$(".interacao:first").children(".meta").children(".rotulo").text();
		
			var distancia = window.parent.$(index_iframe).offset().top;
			//alert(index_iframe);
			//alert(distancia);
			
			var x = $(this).offset().top + distancia - 250;
			//var x = $(this).offset().top + window.parent.$("iframe").offset().top - 250;
			
			//se demo estiver inserida em um iframe em outra página, redimensiona iframe para ficar com a mesma altura da demo
			window.parent.$(index_iframe).children('iframe').height($('html').height());	
			
			//var x = $(this).offset().top - 250;
			//var altura = $("#passo"+index_passo+" .area_interacao").height();
			
			var diferenca = $(document).scrollTop() - $(this).offset().top;
			//var diferenca = $(document).scrollTop() - distancia;
			
			if (diferenca < 0) { diferenca = diferenca * -1; }
			var tempo = diferenca + 800;
			//stop() limpa 'fila' de animações
			window.parent.$('html,body').stop(true, true).animate({scrollTop: x}, tempo);
			
			//interrompe animação da rolagem automática da tela se o usuário rolar a página manualmente
			$(document).on('scroll',window.parent, function(){
				window.parent.$('html,body').stop(true, true);
			});
			
		}
		//para rolar a página da demo, quando ela não está em um iframe
		else {
				var x = $(this).offset().top - 250;
				//var altura = $("#passo"+index_passo+" .area_interacao").height();
				var diferenca = $(document).scrollTop() - $(this).offset().top;
				if (diferenca < 0) { diferenca = diferenca * -1; }
				var tempo = diferenca + 800;
				//stop() limpa 'fila' de animações
				$('html,body').stop(true, true).animate({scrollTop: x}, tempo);
		}
	}	
}});
//}}}